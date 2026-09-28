import { Color, Group, Mesh, MeshStandardMaterial, Object3D } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export type PartKind = 'shell' | 'inner';
export type PartMech =
  | 'static'
  | 'button'
  | 'stem'
  | 'actuator'
  | 'rod'
  | 'clutch'
  | 'jaw'
  | 'springMain'
  | 'springBtn'
  | 'springStab'
  | 'lead'
  | 'sleeve';

export interface PartExtras {
  part: string;
  kind: PartKind;
  mech: PartMech;
  baseY: number;
  explode: number;
  label: string;
  material: string;
  lane?: number;
  radial?: number;
  radialAngle?: number;
  jawAngle?: number;
  length?: number;
  follow?: string;
}

export interface PartRec extends PartExtras {
  /** The extras-carrying node: owns the base translation. */
  node: Object3D;
  meshes: Mesh[];
  lane: number;
}

/** Per-role look-dev. Albedo lift keeps dark anodized character while letting
 *  env highlights survive; roughness never below 0.22 or metal turns chrome. */
const LOOKDEV: Record<string, { rough: number; env: number; lift?: number; metal?: number }> = {
  anodized: { rough: 0.3, env: 2.4, lift: 1.9, metal: 1 },
  dlc: { rough: 0.34, env: 2.1, lift: 1.6, metal: 1 },
  brushed_steel: { rough: 0.3, env: 1.7 },
  polished_steel: { rough: 0.24, env: 1.5 },
  brass: { rough: 0.28, env: 1.7 },
  spring_steel: { rough: 0.27, env: 1.7 },
  polymer: { rough: 0.46, env: 1.1 },
  dark_mech: { rough: 0.38, env: 1.4 },
  reservoir: { rough: 0.14, env: 1.6 },
  eraser: { rough: 0.85, env: 0.6 },
  graphite: { rough: 0.4, env: 1.0 },
  recess: { rough: 0.55, env: 0.8 },
};

/** Materials that get an emissive lift in x-ray so the mechanism reads. */
const GLOW = new Set(['reservoir', 'spring_steel', 'brass', 'brushed_steel']);

export class Assembly {
  readonly root = new Group();
  readonly parts = new Map<string, PartRec>();
  readonly list: PartRec[] = [];
  /** Cloned shell materials, one per source material, for x-ray fading. */
  readonly shellMats: MeshStandardMaterial[] = [];
  readonly glowMats: { mat: MeshStandardMaterial; base: Color }[] = [];
  readonly barrelMats: MeshStandardMaterial[] = [];
  private xrayTransparent = false;

  static async load(url: string, onProgress?: (f: number) => void): Promise<Assembly> {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(url, (e) => {
      if (onProgress && e.total) onProgress(e.loaded / e.total);
    });
    const a = new Assembly();
    a.ingest(gltf.scene);
    return a;
  }

  private ingest(scene: Object3D): void {
    // GLTFLoader nests each mesh under its named node; anchor on the node
    // carrying the extras (it owns the base translation), never the mesh.
    const anchors: Object3D[] = [];
    scene.traverse((o) => {
      if (o.userData && typeof o.userData.part === 'string') anchors.push(o);
    });
    const shellClones = new Map<MeshStandardMaterial, MeshStandardMaterial>();
    const tuned = new Set<MeshStandardMaterial>();

    for (const node of anchors) {
      const ex = node.userData as PartExtras;
      const meshes: Mesh[] = [];
      node.traverse((o) => {
        if ((o as Mesh).isMesh) meshes.push(o as Mesh);
      });
      for (const m of meshes) {
        let mat = m.material as MeshStandardMaterial;
        if (!tuned.has(mat)) {
          tuneLookdev(mat);
          tuned.add(mat);
        }
        if (ex.kind === 'shell') {
          let c = shellClones.get(mat);
          if (!c) {
            c = mat.clone();
            shellClones.set(mat, c);
            this.shellMats.push(c);
          }
          mat = c;
          m.material = c;
        }
        if (mat.name === 'anodized' && !this.barrelMats.includes(mat)) this.barrelMats.push(mat);
        const thin = ex.mech.startsWith('spring') || ex.part === 'lead' || ex.part === 'threadRidges';
        m.castShadow = !thin;
        m.receiveShadow = true;
        m.frustumCulled = false;
      }
      const rec: PartRec = { ...ex, node, meshes, lane: ex.lane ?? 0 };
      this.parts.set(ex.part, rec);
      this.list.push(rec);
      this.root.add(node);
    }

    const seen = new Set<MeshStandardMaterial>();
    for (const p of this.list) {
      if (p.kind === 'shell') continue;
      for (const m of p.meshes) {
        const mat = m.material as MeshStandardMaterial;
        if (GLOW.has(mat.name) && !seen.has(mat)) {
          seen.add(mat);
          this.glowMats.push({ mat, base: mat.color.clone() });
        }
      }
    }
    if (this.list.length !== 42) {
      console.warn(`[assembly] expected 42 parts, found ${this.list.length}`);
    }
  }

  get(name: string): PartRec {
    const p = this.parts.get(name);
    if (!p) throw new Error(`missing part ${name}`);
    return p;
  }

  /** Fade only the shell; floor at 0.15 so the silhouette survives. */
  setXray(xr: number): void {
    const transparent = xr > 0.002;
    const changed = transparent !== this.xrayTransparent;
    this.xrayTransparent = transparent;
    for (const m of this.shellMats) {
      m.opacity = 1 - xr * 0.85;
      m.depthWrite = xr < 0.4;
      if (changed) {
        m.transparent = transparent;
        m.needsUpdate = true;
      }
    }
    for (const { mat, base } of this.glowMats) {
      mat.emissive.copy(base).multiplyScalar(xr * (mat.name === 'reservoir' ? 0.35 : 0.22));
    }
  }

  setBarrelColor(c: Color): void {
    for (const m of this.barrelMats) m.color.copy(c).multiplyScalar(LOOKDEV.anodized.lift!);
  }
}

function tuneLookdev(mat: MeshStandardMaterial): void {
  const l = LOOKDEV[mat.name];
  if (!l) return;
  mat.roughness = Math.max(0.14, l.rough);
  mat.envMapIntensity = l.env;
  if (l.metal !== undefined) mat.metalness = l.metal;
  if (l.lift) mat.color.multiplyScalar(l.lift);
  if (mat.name === 'reservoir') {
    mat.transparent = true;
    mat.depthWrite = false;
  }
}
