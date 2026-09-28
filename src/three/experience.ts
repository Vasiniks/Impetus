import { Box3, Color, Euler, MathUtils, Vector3 } from 'three';
import { Assembly, type PartRec } from './assembly';
import { CameraRig, type Key } from './cameraRig';
import { detectQuality, prefersReducedMotion, type Quality } from './config';
import { Stage } from './stage';
import {
  band,
  canvasDimF,
  chapterIndex,
  clamp01,
  heroCopyF,
  innerExF,
  laneF,
  mechPhase,
  mechStep,
  SCENES,
  shellExF,
  smoothstep,
  xrayF,
} from '../data/scroll';

export interface ExperienceEvents {
  onProgress?(f: number): void;
  onReady?(): void;
  onError?(e: unknown): void;
  onChapter?(i: number): void;
  onMechStep?(i: number): void;
  onLineup?(i: number): void;
}

/** Lane offsets (pencil-local X) for the exploded layout. */
const LANE_X = [-0.95, 0.1, 1.0];
/** Button stroke in model units. */
const STROKE = 0.36;
/** Fraction of the stroke after which the clutch ring bottoms out. */
const RING_STOP = 0.62;

interface Section {
  el: HTMLElement;
  top: number;
  h: number;
  fades: HTMLElement[];
}

// Preallocated temporaries: the frame loop allocates nothing.
const _v0 = new Vector3();
const _v1 = new Vector3();
const _pA = new Vector3();
const _tA = new Vector3();
const _pB = new Vector3();
const _tB = new Vector3();
const _pos = new Vector3();
const _tgt = new Vector3();
const _e = new Euler(0, 0, 0, 'XZY');
const _c = new Color();

export class Experience {
  readonly quality: Quality;
  private stage: Stage;
  private rig = new CameraRig();
  private asm: Assembly | null = null;
  private raf = 0;
  private last = 0;
  private disposed = false;

  private sections: Section[] = [];
  private lineupTrack: HTMLElement | null = null;
  private mechSteps: HTMLElement[] = [];
  private vw = 1;
  private vh = 1;

  private s = 0;
  private sTarget = 0;
  private camPos = new Vector3(0, 0, 30);
  private camTgt = new Vector3();
  private camFov = 30;
  private camInit = false;
  private turntable = 0;
  private motion = true;
  private dirty = true;
  private groundY = -6.2;

  private tint = new Color();
  private tintTarget = new Color();
  private tintLive = false;

  private chapter = -1;
  private step = -1;
  private lineupIdx = -1;
  private staggers = new Map<string, number>();
  private resizeObs: ResizeObserver | null = null;

  constructor(
    private canvas: HTMLCanvasElement,
    private events: ExperienceEvents = {},
  ) {
    this.quality = detectQuality();
    this.stage = new Stage(canvas, this.quality);
    this.motion = !prefersReducedMotion();
    this.onResize = this.onResize.bind(this);
    this.onScroll = this.onScroll.bind(this);
    this.frame = this.frame.bind(this);
  }

  async init(initialColor: string): Promise<void> {
    this.measure();
    this.onResize();
    window.addEventListener('resize', this.onResize);
    window.addEventListener('scroll', this.onScroll, { passive: true });
    this.resizeObs = new ResizeObserver(() => {
      this.measure();
      this.dirty = true;
    });
    this.resizeObs.observe(document.body);

    try {
      const asm = await Assembly.load(this.quality.modelUrl, (f) => this.events.onProgress?.(f));
      if (this.disposed) return;
      this.asm = asm;
      asm.root.position.y = -0.4; // centre the 15-unit assembly on the pivot
      this.stage.pencilPivot.add(asm.root);
      this.computeStaggers(asm);
      this.tint.set(initialColor);
      this.tintTarget.copy(this.tint);
      asm.setBarrelColor(this.tint);
      this.onScroll();
      this.s = this.sTarget;
      this.update(1 / 60, true);
      this.stage.renderer.compile(this.stage.scene, this.stage.camera);
      this.stage.render();
      this.events.onProgress?.(1);
      this.events.onReady?.();
      this.last = performance.now();
      this.raf = requestAnimationFrame(this.frame);
    } catch (e) {
      this.events.onError?.(e);
    }
  }

  setVariant(hex: string): void {
    _c.set(hex);
    if (_c.equals(this.tintTarget)) return;
    this.tintTarget.copy(_c);
    this.tintLive = true;
    this.dirty = true;
  }

  setMotion(on: boolean): void {
    this.motion = on;
    this.dirty = true;
  }

  dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('scroll', this.onScroll);
    this.resizeObs?.disconnect();
    this.stage.dispose();
  }

  /** Scene-graph snapshot for QA (Playwright reads this). */
  debugState() {
    const a = this.asm;
    return {
      s: this.s,
      chapter: this.chapter,
      parts: a?.list.length ?? 0,
      tier: this.quality.tier,
      calls: this.stage.renderer.info.render.calls,
      triangles: this.stage.renderer.info.render.triangles,
      camera: this.stage.camera.position.toArray(),
      tip: a ? a.get('lead').node.getWorldPosition(new Vector3()).toArray() : null,
      barrel: a?.barrelMats[0]?.color.getHexString() ?? null,
      ndc: this.debugBounds(),
    };
  }

  /** Screen-space (NDC) extent of the whole pencil, for framing checks. */
  private debugBounds() {
    if (!this.asm) return null;
    const cam = this.stage.camera;
    cam.updateMatrixWorld();
    const b = new Box3();
    const tmp = new Box3();
    for (const p of this.asm.list) {
      if (p.kind === 'shell' && p.meshes[0] && (p.meshes[0].material as { opacity: number }).opacity < 0.5) continue;
      for (const m of p.meshes) b.union(tmp.setFromObject(m));
    }
    let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    const v = new Vector3();
    for (let i = 0; i < 8; i++) {
      v.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).project(cam);
      x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y);
    }
    return { x0, x1, y0, y1 };
  }

  // ---------------------------------------------------------------------

  private measure(): void {
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-scene]'));
    const y = window.scrollY;
    this.sections = SCENES.map((id) => {
      const el = els.find((e) => e.dataset.scene === id);
      if (!el) return { el: document.body, top: 0, h: 1, fades: [] };
      const r = el.getBoundingClientRect();
      return {
        el,
        top: r.top + y,
        h: Math.max(1, r.height),
        fades: Array.from(el.querySelectorAll<HTMLElement>('[data-fade]')),
      };
    });
    this.lineupTrack = document.querySelector('[data-lineup-track]');
    this.mechSteps = Array.from(document.querySelectorAll<HTMLElement>('[data-mech-step]'));
  }

  private onResize(): void {
    this.vw = window.innerWidth;
    this.vh = window.innerHeight;
    this.stage.resize(this.vw, this.vh);
    this.rig.setViewport(this.vw, this.vh);
    this.measure();
    this.onScroll();
    this.dirty = true;
  }

  private onScroll(): void {
    const anchor = window.scrollY + this.vh * 0.5;
    const secs = this.sections;
    let s = 0;
    for (let i = 0; i < secs.length; i++) {
      const sec = secs[i];
      if (anchor < sec.top + sec.h || i === secs.length - 1) {
        s = i + Math.max(0, (anchor - sec.top) / sec.h);
        break;
      }
    }
    this.sTarget = s;
    this.dirty = true;
  }

  private computeStaggers(asm: Assembly): void {
    // Parts that travel furthest start first, so the explode reads as a sequence.
    const maxEx = Math.max(...asm.list.map((p) => Math.abs(p.explode)));
    for (const p of asm.list) this.staggers.set(p.part, 1 - Math.abs(p.explode) / maxEx);
  }

  private frame(now: number): void {
    this.raf = requestAnimationFrame(this.frame);
    const dt = Math.min(0.05, Math.max(0.001, (now - this.last) / 1000));
    this.last = now;
    this.update(dt, false);
  }

  private update(dt: number, force: boolean): void {
    const asm = this.asm;
    if (!asm) return;
    const motion = this.motion;

    // 1. progress (frame-rate independent damping)
    const ds = this.sTarget - this.s;
    this.s = motion ? this.s + ds * (1 - Math.exp(-5 * dt)) : this.sTarget;
    if (Math.abs(this.sTarget - this.s) < 1e-4) this.s = this.sTarget;
    const s = this.s;

    const heroSpin = motion ? 1 - smoothstep(0.4, 0.9, s) : 0;
    const buySpin = motion ? smoothstep(8.1, 8.4, s) : 0;
    const spinning = heroSpin > 0.001 || buySpin > 0.001;
    if (spinning) this.turntable += dt * 0.16 * Math.max(heroSpin, buySpin * 0.6);

    // tint chase
    if (this.tintLive) {
      const k = motion ? 1 - Math.exp(-6 * dt) : 1;
      this.tint.lerp(this.tintTarget, k);
      if (Math.abs(this.tint.r - this.tintTarget.r) + Math.abs(this.tint.g - this.tintTarget.g) + Math.abs(this.tint.b - this.tintTarget.b) < 0.002) {
        this.tint.copy(this.tintTarget);
        this.tintLive = false;
      }
      asm.setBarrelColor(this.tint);
    }

    const settled = !force && !this.dirty && Math.abs(ds) < 1e-4 && !spinning && !this.tintLive && this.camSettled;
    this.updateDom(s);
    if (settled) return;
    this.dirty = false;

    // 2. pencil attitude
    const smp = this.rig.sample(s);
    const { a, b, t } = smp;
    const lineupSpin = band(s, 7.0, 7.12, 7.88, 8.05) * this.lineupProgress() * Math.PI * 2;
    const pivot = this.stage.pencilPivot;
    _e.set(
      MathUtils.lerp(a.rx, b.rx, t),
      MathUtils.lerp(a.spin, b.spin, t) + this.turntable + lineupSpin,
      MathUtils.lerp(a.rz, b.rz, t),
      'XZY',
    );
    pivot.quaternion.setFromEuler(_e);
    pivot.position.set(MathUtils.lerp(a.px, b.px, t), MathUtils.lerp(a.py, b.py, t), 0);

    // 3. parts
    this.updateParts(asm, s);
    pivot.updateMatrixWorld(true);

    // 4. camera: resolve both keys against live tracked points, then blend
    this.track(a, _v0);
    this.rig.resolve(a, _v0, _pA, _tA);
    this.track(b, _v1);
    this.rig.resolve(b, _v1, _pB, _tB);
    _pos.lerpVectors(_pA, _pB, t);
    _tgt.lerpVectors(_tA, _tB, t);
    const fov = MathUtils.lerp(a.fov, b.fov, t);
    const kc = motion && this.camInit && !force ? 1 - Math.exp(-8 * dt) : 1;
    this.camInit = true;
    this.camPos.lerp(_pos, kc);
    this.camTgt.lerp(_tgt, kc);
    this.camFov += (fov - this.camFov) * kc;
    this.camSettled = this.camPos.distanceToSquared(_pos) < 1e-6 && this.camTgt.distanceToSquared(_tgt) < 1e-6;
    const cam = this.stage.camera;
    cam.position.copy(this.camPos);
    cam.lookAt(this.camTgt);
    if (Math.abs(cam.fov - this.camFov) > 1e-4) {
      cam.fov = this.camFov;
      cam.updateProjectionMatrix();
    }

    // 5. ground follows the lowest point of the pencil
    const tipY = asm.get('noseTip').node.getWorldPosition(_v0).y;
    const capY = asm.get('button').node.getWorldPosition(_v1).y;
    const gy = Math.min(tipY, capY, pivot.position.y - 1.2) - 1.3;
    this.groundY = motion && !force ? this.groundY + (gy - this.groundY) * (1 - Math.exp(-4 * dt)) : gy;
    this.stage.ground.position.y = this.groundY;
    this.stage.setShadowStrength(1 - 0.85 * Math.max(laneF(s), band(s, 0.6, 0.95, 1.8, 2.0)));
    this.stage.key.target.position.copy(pivot.position);

    // 6. canvas dim behind portrait editorial copy
    const dim = this.rig.portrait ? canvasDimF(s) * 0.72 : 0;
    this.canvas.style.opacity = String(1 - dim);

    this.stage.render();
  }

  private camSettled = false;

  private track(key: Key, out: Vector3): void {
    if (!key.track || !this.asm) {
      out.set(0, 0, 0);
      return;
    }
    this.asm.get(key.track).node.getWorldPosition(out);
  }

  private lineupProgress(): number {
    const sec = this.sections[SCENES.indexOf('lineup')];
    if (!sec) return 0;
    return clamp01((window.scrollY - sec.top) / Math.max(1, sec.h - this.vh));
  }

  private updateParts(asm: Assembly, s: number): void {
    const shellEx = shellExF(s);
    const lf = laneF(s);
    const iex = innerExF(s);
    const lift = band(s, 3.86, 4.2, 5.0, 5.4);
    asm.setXray(xrayF(s));

    // mechanism kinematics
    const m = mechPhase(s);
    const pressIn = smoothstep(0, 0.4, m);
    const d = pressIn - smoothstep(0.55, 0.8, m);
    const jawOpen = band(m, 0.4, 0.52, 0.72, 0.86);
    const rod = -d * STROKE;
    const ring = -Math.min(d, RING_STOP) * STROKE;
    const lead = -Math.min(pressIn, RING_STOP) * STROKE;

    for (const p of asm.list) {
      const stag = this.staggers.get(p.part) ?? 0;
      const raw = p.kind === 'shell' ? shellEx : iex;
      // staggered, eased per-part progress (outermost parts lead)
      const ax = raw <= 0 ? 0 : raw >= 1 ? 1 : smoothstep(0, 1, clamp01((raw - stag * 0.28) / 0.72));
      let x = 0;
      let z = 0;
      if (p.lane > 0 || p.kind === 'shell') {
        const lx = p.lane === 2 ? MathUtils.lerp(LANE_X[1], LANE_X[2], iex) : LANE_X[p.lane === 0 ? 0 : 1];
        x = lx * lf;
        // shells step further aside so the isolated mechanism has the frame
        if (p.kind === 'shell') x -= lift * 1.7;
      }
      if (p.radial) {
        const ang = p.radialAngle ?? 0;
        let r = p.radial * (p.kind === 'shell' ? shellEx : ax);
        if (p.mech === 'jaw') r += jawOpen * 0.034;
        x += Math.cos(ang) * r;
        z += Math.sin(ang) * r;
      }
      let y = p.baseY + p.explode * ax;
      let sy = 1;
      switch (p.mech) {
        case 'rod':
        case 'actuator':
        case 'jaw':
          y += rod;
          break;
        case 'clutch':
        case 'sleeve':
          y += ring;
          break;
        case 'button':
        case 'stem':
          y += rod * 1.08;
          break;
        case 'lead':
          y += lead;
          break;
        case 'springMain':
          sy = 1 - (d * STROKE) / (p.length ?? 1);
          break;
        case 'springBtn':
          sy = 1 - (d * STROKE * 0.3) / (p.length ?? 1);
          break;
      }
      this.place(p, x, y, z, sy);
    }
  }

  private place(p: PartRec, x: number, y: number, z: number, sy: number): void {
    const n = p.node;
    n.position.set(x, y, z);
    n.scale.set(1, sy, 1);
  }

  private updateDom(s: number): void {
    const vh = this.vh;
    const anchor = window.scrollY + vh * 0.5;
    for (let i = 0; i < this.sections.length; i++) {
      const sec = this.sections[i];
      if (!sec.fades.length) continue;
      const f = (anchor - sec.top) / sec.h;
      const inView = f > -0.3 && f < 1.3;
      if (!inView) continue;
      const span = Math.min(0.18, (vh * 0.35) / sec.h);
      const o = i === 0 ? heroCopyF(s) : band(f, 0.02, 0.02 + span, 0.98 - span, 0.995);
      for (const el of sec.fades) {
        let oo = o;
        if (i !== 0) {
          const range = el.dataset.range;
          if (range) {
            const [r0, r1] = range.split(',').map(Number);
            oo = band(f, r0, r0 + span, r1 - span, r1);
          } else {
            const delay = Number(el.dataset.fade || 0) * 0.04;
            oo = band(f, 0.02 + delay, 0.02 + span + delay, 0.98 - span, 0.995);
          }
        }
        const v = oo.toFixed(3);
        if (el.style.opacity !== v) {
          el.style.opacity = v;
          el.style.transform = `translate3d(0, ${((1 - oo) * 18).toFixed(1)}px, 0)`;
          el.style.visibility = oo < 0.01 ? 'hidden' : 'visible';
        }
      }
    }

    const ch = chapterIndex(s);
    if (ch !== this.chapter) {
      this.chapter = ch;
      this.events.onChapter?.(ch);
    }

    const m = mechPhase(s);
    const st = s < 4 || s > 5.2 ? -1 : mechStep(m);
    if (st !== this.step) {
      this.step = st;
      this.mechSteps.forEach((el, i) => el.toggleAttribute('data-active', i === st));
      this.events.onMechStep?.(st);
    }

    const lp = this.lineupProgress();
    if (this.lineupTrack) {
      const track = this.lineupTrack;
      const travel = Math.max(0, track.scrollWidth - track.parentElement!.clientWidth);
      const tx = `translate3d(${(-lp * travel).toFixed(1)}px, 0, 0)`;
      if (track.style.transform !== tx) track.style.transform = tx;
      const n = track.children.length;
      const idx = Math.round(lp * (n - 1));
      if (idx !== this.lineupIdx && s > 6.9 && s < 8.05) {
        this.lineupIdx = idx;
        this.events.onLineup?.(idx);
      }
    }
  }
}
