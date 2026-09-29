import {
  Color,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
  Plane,
  ShaderMaterial,
  Vector3,
} from 'three';
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
  /** Local-space bounding centre of every part (callout anchors). */
  readonly centers = new Map<string, Vector3>();
  /** Keeps shell fragments behind the scan front; the ghost keeps the rest. */
  readonly solidClip = new Plane();
  readonly ghostClip = new Plane();
  xray = 0;
  private ghosts: Object3D[] = [];
  private ghostMat = makeGhostMaterial(this.ghostClip);
  private edgeMat = new LineBasicMaterial({
    color: INK,
    transparent: true,
    opacity: 0.62,
    depthWrite: false,
    clippingPlanes: [this.ghostClip],
  });
  private scan = new Group();
  private scanLine: MeshBasicMaterial;
  private scanHalo: MeshBasicMaterial;
  private ghostsOn = false;

  constructor() {
    // The scan front: a hairline with a soft halo, perpendicular to the axis.
    this.scanLine = new MeshBasicMaterial({ color: INK, transparent: true, depthWrite: false, toneMapped: false });
    this.scanHalo = new MeshBasicMaterial({ color: INK, transparent: true, depthWrite: false, toneMapped: false });
    const line = new Mesh(new PlaneGeometry(1, 1), this.scanLine);
    line.scale.set(6.2, 0.014, 1);
    const halo = new Mesh(new PlaneGeometry(1, 1), this.scanHalo);
    halo.scale.set(6.2, 0.22, 1);
    line.position.x = halo.position.x = -0.55;
    line.renderOrder = halo.renderOrder = 3;
    this.scan.add(halo, line);
    this.scan.visible = false;
    this.root.add(this.scan);
  }

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
            c.clippingPlanes = [this.solidClip];
            c.clipShadows = true;
            shellClones.set(mat, c);
            this.shellMats.push(c);
          }
          mat = c;
          m.material = c;
          // x-ray twins: a fresnel ghost and crisp machined edges
          const ghost = new Mesh(m.geometry, this.ghostMat);
          ghost.renderOrder = 2;
          ghost.frustumCulled = false;
          const edges = new LineSegments(new EdgesGeometry(m.geometry, 28), this.edgeMat);
          edges.renderOrder = 2;
          edges.frustumCulled = false;
          ghost.visible = edges.visible = false;
          m.add(ghost, edges);
          this.ghosts.push(ghost, edges);
        }
        if (mat.name === 'anodized' && !this.barrelMats.includes(mat)) this.barrelMats.push(mat);
        const thin = ex.mech.startsWith('spring') || ex.part === 'lead' || ex.part === 'threadRidges';
        m.castShadow = !thin;
        m.receiveShadow = true;
        m.frustumCulled = false;
      }
      meshes[0].geometry.computeBoundingBox();
      this.centers.set(ex.part, meshes[0].geometry.boundingBox!.getCenter(new Vector3()));
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

  /**
   * X-ray as a scan: a front sweeps from the button to the tip. Behind it the
   * shell is solid metal; past it the shell becomes a blueprint — fresnel
   * ghost plus machined edges — and the mechanism lifts in brightness.
   * Call after the scene graph's world matrices are current.
   */
  setXray(xr: number): void {
    this.xray = xr;
    const on = xr > 0.001;
    if (on !== this.ghostsOn) {
      this.ghostsOn = on;
      for (const g of this.ghosts) g.visible = on;
    }
    // front position along the pencil axis, in root-local units
    const front = 11.5 - 23 * xr;
    const e = this.root.matrixWorld.elements;
    _axis.set(e[4], e[5], e[6]).normalize();
    _origin.set(e[12], e[13], e[14]);
    const c = _axis.dot(_origin) + front;
    this.solidClip.normal.copy(_axis).negate();
    this.solidClip.constant = c;
    this.ghostClip.normal.copy(_axis);
    this.ghostClip.constant = -c;

    const sweeping = xr > 0.004 && xr < 0.996;
    this.scan.visible = sweeping;
    if (sweeping) {
      this.scan.position.y = front;
      const k = Math.sin(Math.PI * xr);
      this.scanLine.opacity = 0.9 * Math.min(1, k * 3);
      this.scanHalo.opacity = 0.05 * k;
    }
    this.ghostMat.uniforms.uOpacity.value = Math.min(1, xr * 4);

    for (const { mat, base } of this.glowMats) {
      mat.emissive.copy(base).multiplyScalar(xr * (mat.name === 'reservoir' ? 0.35 : 0.22));
    }
  }

  setBarrelColor(c: Color): void {
    for (const m of this.barrelMats) m.color.copy(c).multiplyScalar(LOOKDEV.anodized.lift!);
  }
}

const INK = new Color('#20405f');
const _axis = new Vector3();
const _origin = new Vector3();

function makeGhostMaterial(clip: Plane): ShaderMaterial {
  const m = new ShaderMaterial({
    uniforms: { uColor: { value: INK.clone() }, uOpacity: { value: 0 } },
    vertexShader: /* glsl */ `
      #include <clipping_planes_pars_vertex>
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
        #include <clipping_planes_vertex>
      }`,
    fragmentShader: /* glsl */ `
      #include <clipping_planes_pars_fragment>
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        #include <clipping_planes_fragment>
        float f = 1.0 - abs(dot(normalize(vN), normalize(vV)));
        float a = uOpacity * (0.045 + 0.5 * pow(f, 2.6));
        gl_FragColor = vec4(uColor, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true,
    depthWrite: false,
  });
  m.clipping = true;
  m.clippingPlanes = [clip];
  return m;
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
