import { MathUtils, Vector3 } from 'three';
import { smoothstep } from '../data/scroll';

/**
 * Camera + pencil-attitude keyframes. Each key pairs a pencil pose with a
 * framing request: a tracked point (pencil origin or a named part's live
 * world position), a world-space offset, a view direction and the world
 * extent that must fit. Distance is solved per viewport, so the exploded
 * view always fits top-to-bottom and edge-to-edge.
 */
export interface Key {
  s: number;
  /** pencil attitude (radians): tilt in the image plane, tilt toward camera, spin about its own axis */
  rz: number;
  rx: number;
  spin: number;
  /** pencil position (world) */
  px: number;
  py: number;
  /** tracked point: '' = world origin, or a part name */
  track: string;
  tOff: [number, number, number];
  dir: [number, number, number];
  fitW: number;
  fitH: number;
  fov: number;
}

const H = -Math.PI / 2;

type K = Omit<Key, 's'>;
const k = (s0: number, s1: number, key: K, key1?: Partial<K>): Key[] => [
  { s: s0, ...key },
  { s: s1, ...key, ...key1 },
];

const LANDSCAPE: Key[] = [
  ...k(0, 0.55, { rz: -1.2, rx: 0.3, spin: 0.55, px: 2.4, py: 1.35, track: '', tOff: [0.9, 0, 0], dir: [0, 0.07, 1], fitW: 21.5, fitH: 10.5, fov: 30 },
    { spin: 0.85 }),
  ...k(1.05, 1.75, { rz: H - 0.06, rx: 0.2, spin: 0.08, px: 0, py: 0, track: 'gripUnderlay', tOff: [1.25, -0.32, 0], dir: [-0.22, 0.24, 1], fitW: 5.8, fitH: 3.2, fov: 26 },
    { spin: 0.62 }),
  ...k(2.35, 2.85, { rz: H, rx: 0.16, spin: 0, px: 0, py: 0, track: '', tOff: [0.35, 0.3, 0], dir: [0, 0.1, 1], fitW: 18.6, fitH: 4.8, fov: 28 }),
  ...k(3.3, 3.85, { rz: H, rx: 0.2, spin: 0, px: 0, py: 0, track: '', tOff: [0.35, -0.35, 0], dir: [-0.05, 0.14, 1], fitW: 17.2, fitH: 4.8, fov: 28 }),
  ...k(4.2, 4.95, { rz: H, rx: 0.22, spin: 0, px: 0, py: 0, track: 'clutchJaw0', tOff: [-0.35, -0.05, 0], dir: [-0.12, 0.18, 1], fitW: 4.7, fitH: 2.0, fov: 26 }),
  ...k(5.55, 5.82, { rz: H + 0.1, rx: 0.3, spin: -0.4, px: 0, py: 0, track: '', tOff: [0.3, 0, 0], dir: [0, 0.1, 1], fitW: 19, fitH: 6, fov: 28 }),
  ...k(6.12, 6.88, { rz: -0.22, rx: 0.16, spin: 0.2, px: 3.8, py: -0.3, track: '', tOff: [0, 0, 0], dir: [0, 0.05, 1], fitW: 19, fitH: 19.5, fov: 30 },
    { spin: 1.6 }),
  ...k(7.12, 7.88, { rz: H, rx: 0.2, spin: 0.2, px: 0, py: 1.35, track: '', tOff: [0.4, 0.2, 0], dir: [0, 0.08, 1], fitW: 19.5, fitH: 11, fov: 28 }),
  ...k(8.25, 9, { rz: -1.02, rx: 0.3, spin: 0.35, px: -3.4, py: 0.1, track: '', tOff: [0, 0, 0], dir: [0, 0.06, 1], fitW: 22, fitH: 12.5, fov: 30 }),
];

const PORTRAIT: Key[] = [
  ...k(0, 0.55, { rz: -0.36, rx: 0.22, spin: 0.55, px: 0.2, py: 0.9, track: '', tOff: [0, -0.3, 0], dir: [0, 0.05, 1], fitW: 7.4, fitH: 18.5, fov: 34 },
    { spin: 0.85 }),
  ...k(1.05, 1.75, { rz: -0.1, rx: 0.24, spin: 0.08, px: 0, py: 0, track: 'gripUnderlay', tOff: [0, -1.55, 0], dir: [-0.2, 0.22, 1], fitW: 3.4, fitH: 6.6, fov: 30 },
    { spin: 0.62 }),
  ...k(2.35, 2.85, { rz: 0, rx: 0.1, spin: 0, px: 0, py: 0, track: '', tOff: [0.05, 1.5, 0], dir: [0, 0.06, 1], fitW: 4.8, fitH: 22.5, fov: 34 }),
  ...k(3.3, 3.85, { rz: 0, rx: 0.12, spin: 0, px: 0, py: 0, track: '', tOff: [0.5, 2.3, 0], dir: [0.1, 0.1, 1], fitW: 3.6, fitH: 23, fov: 34 }),
  ...k(4.2, 4.95, { rz: 0, rx: 0.14, spin: 0, px: 0, py: 0, track: 'clutchJaw0', tOff: [0, -1.1, 0], dir: [0.14, 0.12, 1], fitW: 2.6, fitH: 8.2, fov: 32 }),
  ...k(5.55, 5.82, { rz: -0.08, rx: 0.3, spin: -0.4, px: 0, py: 0.5, track: '', tOff: [0, 0, 0], dir: [0, 0.08, 1], fitW: 6.5, fitH: 18.5, fov: 34 }),
  ...k(6.12, 6.88, { rz: -0.16, rx: 0.16, spin: 0.2, px: 0, py: 0, track: '', tOff: [0, 0, 0], dir: [0, 0.05, 1], fitW: 8, fitH: 18, fov: 34 },
    { spin: 1.6 }),
  ...k(7.12, 7.88, { rz: -0.72, rx: 0.2, spin: 0.2, px: 0, py: 2.4, track: '', tOff: [0, 0.2, 0], dir: [0, 0.06, 1], fitW: 12.5, fitH: 24, fov: 34 }),
  ...k(8.25, 9, { rz: -0.92, rx: 0.26, spin: 0.35, px: 0, py: 7.4, track: '', tOff: [0, 0, 0], dir: [0, 0.06, 1], fitW: 13.5, fitH: 26, fov: 34 }),
];

export interface CamSample {
  a: Key;
  b: Key;
  t: number;
}

export class CameraRig {
  private keys = LANDSCAPE;
  portrait = false;
  aspect = 1;

  setViewport(w: number, h: number): void {
    this.aspect = w / h;
    this.portrait = this.aspect < 0.9;
    this.keys = this.portrait ? PORTRAIT : LANDSCAPE;
  }

  /** Smoothstep-blended pair of keys around `s`. */
  sample(s: number): CamSample {
    const K = this.keys;
    if (s <= K[0].s) return { a: K[0], b: K[0], t: 0 };
    for (let i = 0; i < K.length - 1; i++) {
      if (s <= K[i + 1].s) {
        const t = smoothstep(K[i].s, K[i + 1].s, s);
        return { a: K[i], b: K[i + 1], t };
      }
    }
    const last = K[K.length - 1];
    return { a: last, b: last, t: 0 };
  }

  /** Distance at which a fitW x fitH world rectangle fills the frame. */
  fitDistance(fitW: number, fitH: number, fov: number): number {
    const v = Math.tan(MathUtils.degToRad(fov) / 2);
    return Math.max(fitH / (2 * v), fitW / (2 * v * this.aspect));
  }

  /** Resolve one key into camera position/target given its tracked point. */
  resolve(key: Key, tracked: Vector3, outPos: Vector3, outTarget: Vector3): void {
    outTarget.set(tracked.x + key.tOff[0], tracked.y + key.tOff[1], tracked.z + key.tOff[2]);
    const d = this.fitDistance(key.fitW, key.fitH, key.fov);
    outPos.set(key.dir[0], key.dir[1], key.dir[2]).normalize().multiplyScalar(d).add(outTarget);
  }
}
