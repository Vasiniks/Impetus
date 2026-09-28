import {
  ACESFilmicToneMapping,
  BackSide,
  BoxGeometry,
  Color,
  DirectionalLight,
  Group,
  HalfFloatType,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  VSMShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShadowMaterial,
  SRGBColorSpace,
  Texture,
  Vector2,
  WebGLRenderer,
  WebGLRenderTarget,
} from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import type { Quality } from './config';

/**
 * Procedural studio for PMREM: a near-black room lit by HDR softboxes, strips
 * and bounce cards. Dark anodized metal only reads as metal when it has bright
 * shapes to reflect; RoomEnvironment alone leaves it near-black.
 */
function buildStudioEnv(renderer: WebGLRenderer, size: number): Texture {
  const env = new Scene();
  const room = new Mesh(
    new BoxGeometry(40, 30, 40),
    new MeshBasicMaterial({ color: new Color(0.012, 0.012, 0.013), side: BackSide }),
  );
  env.add(room);

  const card = (
    w: number,
    h: number,
    intensity: number,
    tint: [number, number, number],
    pos: [number, number, number],
    look: [number, number, number] = [0, 0, 0],
  ) => {
    const m = new Mesh(
      new PlaneGeometry(w, h),
      new MeshBasicMaterial({
        color: new Color(tint[0] * intensity, tint[1] * intensity, tint[2] * intensity),
        side: BackSide,
      }),
    );
    m.position.set(...pos);
    m.lookAt(...look);
    // PlaneGeometry faces +Z; BackSide makes the lit face point at `look`.
    m.rotateY(Math.PI);
    env.add(m);
    return m;
  };

  const warm: [number, number, number] = [1.0, 0.95, 0.88];
  const cool: [number, number, number] = [0.86, 0.92, 1.0];
  const neutral: [number, number, number] = [1, 1, 1];
  // 1 overhead softbox — broad sheen across the top facets
  card(14, 9, 2.6, neutral, [0, 11, 1], [0, 0, 0]);
  // 2 key softbox, front-left
  card(6, 10, 7.5, warm, [-10, 3, 8]);
  // 3 cool rim strip, back-right
  card(1.4, 16, 11, cool, [11, 1, -7]);
  // 4 secondary strip, back-left
  card(1.0, 14, 6, neutral, [-12, 0, -6]);
  // 5 thin edge strip above camera: crisp line highlights on hex edges
  card(20, 0.5, 14, neutral, [0, 6, 11]);
  // 6 low front fill
  card(18, 3, 1.1, warm, [0, -3, 12]);
  // 7 paper bounce from below (the page the product sits on)
  card(30, 30, 0.9, [0.96, 0.94, 0.9], [0, -12, 0]);
  // 8 kicker, right-front, narrow
  card(1.2, 8, 5, cool, [12, 4, 6]);

  const pmrem = new PMREMGenerator(renderer);
  const rt = pmrem.fromScene(env, 0.035, 0.1, 100, { size });
  pmrem.dispose();
  env.traverse((o) => {
    if (o instanceof Mesh) {
      o.geometry.dispose();
      (o.material as MeshBasicMaterial).dispose();
    }
  });
  return rt.texture;
}

export class Stage {
  readonly renderer: WebGLRenderer;
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(30, 1, 0.1, 200);
  readonly pencilPivot = new Group();
  readonly ground: Mesh;
  readonly key: DirectionalLight;
  private composer: EffectComposer | null = null;
  private size = new Vector2();

  constructor(
    readonly canvas: HTMLCanvasElement,
    readonly quality: Quality,
  ) {
    this.renderer = new WebGLRenderer({
      canvas,
      alpha: true,
      antialias: quality.msaa === 0,
      powerPreference: 'high-performance',
      premultipliedAlpha: true,
    });
    const r = this.renderer;
    r.setPixelRatio(quality.dpr);
    r.outputColorSpace = SRGBColorSpace;
    r.toneMapping = ACESFilmicToneMapping;
    r.toneMappingExposure = 1.06;
    r.setClearColor(0x000000, 0);
    r.shadowMap.enabled = quality.shadows;
    r.shadowMap.type = VSMShadowMap;

    this.scene.environment = buildStudioEnv(r, quality.envResolution);
    this.scene.add(this.pencilPivot);

    // Five-light rig: warm key, cool rim, soft fill, top sheen, edge strip.
    const key = new DirectionalLight(new Color(1.0, 0.95, 0.88), 3.2);
    key.position.set(-6, 12, 7);
    if (quality.shadows) {
      key.castShadow = true;
      key.shadow.mapSize.set(quality.shadowMapSize, quality.shadowMapSize);
      const c = key.shadow.camera;
      c.left = -13;
      c.right = 13;
      c.top = 13;
      c.bottom = -13;
      c.near = 1;
      c.far = 40;
      key.shadow.bias = -0.0005;
      key.shadow.radius = 14;
      key.shadow.blurSamples = 16;
    }
    this.key = key;
    const rim = new DirectionalLight(new Color(0.82, 0.9, 1.0), 2.8);
    rim.position.set(8, 3, -9);
    const fill = new HemisphereLight(new Color(1, 0.98, 0.95), new Color(0.55, 0.52, 0.48), 0.65);
    const top = new DirectionalLight(0xffffff, 1.4);
    top.position.set(0, 14, 1);
    const edge = new DirectionalLight(new Color(1, 0.97, 0.92), 1.0);
    edge.position.set(-9, -2, -3);
    this.scene.add(key, key.target, rim, fill, top, edge);

    // Shadow catcher: only the shadow is visible, the page paper shows through.
    this.ground = new Mesh(
      new PlaneGeometry(80, 80),
      new ShadowMaterial({ color: 0x2a2620, opacity: 0.2 }),
    );
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.y = -6.2;
    this.ground.receiveShadow = true;
    this.ground.visible = quality.shadows;
    this.scene.add(this.ground);

    if (quality.msaa > 0) {
      // Samples must be set at construction: render-target textures are immutable.
      const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: quality.msaa });
      this.composer = new EffectComposer(r, target);
      this.composer.addPass(new RenderPass(this.scene, this.camera));
      this.composer.addPass(new OutputPass());
    }
  }

  setShadowStrength(k: number): void {
    (this.ground.material as ShadowMaterial).opacity = 0.2 * k;
  }

  resize(w: number, h: number): void {
    this.size.set(w, h);
    this.renderer.setSize(w, h, false);
    if (this.composer) {
      this.composer.setPixelRatio(this.quality.dpr);
      this.composer.setSize(w, h);
    }
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  render(): void {
    if (this.composer) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  dispose(): void {
    this.composer?.dispose();
    this.scene.environment?.dispose();
    this.renderer.dispose();
  }
}
