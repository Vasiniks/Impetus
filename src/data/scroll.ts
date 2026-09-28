/**
 * Scroll timeline. `s` is a continuous scene coordinate: the integer part is
 * the index of the section under the viewport centre line, the fraction is
 * how far that line has travelled through it. Every envelope below is a
 * product of smoothsteps over `s`, so the same choreography holds on any
 * viewport regardless of section pixel heights.
 */

export const SCENES = [
  'hero',
  'detail',
  'exploded',
  'xray',
  'mechanism',
  'reassembly',
  'philosophy',
  'lineup',
  'buy',
] as const;
export type SceneId = (typeof SCENES)[number];

/** The eight chapter labels shown in the nav / stage HUD. */
export const CHAPTERS = [
  'Reveal',
  'Detail',
  'Exploded',
  'X-Ray',
  'Mechanism',
  'Reassembly',
  'Object',
  'Lineup',
] as const;

export const chapterIndex = (s: number) => Math.max(0, Math.min(CHAPTERS.length - 1, Math.floor(s)));

export const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
/** Rises over [a,b], falls over [c,d]. */
export const band = (s: number, a: number, b: number, c: number, d: number) =>
  smoothstep(a, b, s) * (1 - smoothstep(c, d, s));

// ---- envelopes ----
/** Shell parts leave the axis. */
export const shellExF = (s: number) => band(s, 1.86, 2.4, 5.02, 5.55);
/** Mechanism lanes separate sideways. */
export const laneF = (s: number) => band(s, 1.86, 2.4, 5.02, 5.55);
/** Mechanism parts spread along the axis; they regroup for the mechanism chapter. */
export const innerExF = (s: number) => band(s, 1.86, 2.4, 3.92, 4.22);
/** Shell fades to a ghost. */
export const xrayF = (s: number) => band(s, 2.9, 3.3, 5.22, 5.62);
/** Normalised position inside the press cycle. */
export const mechPhase = (s: number) => clamp01((s - 4.26) / 0.62);
export const heroCopyF = (s: number) => 1 - smoothstep(0.62, 0.9, s);
/** Portrait only: dim the canvas behind long-form editorial copy. */
export const canvasDimF = (s: number) => band(s, 5.9, 6.12, 6.86, 7.06);

export const MECH_STEPS = 5;
export const mechStep = (m: number) => Math.min(MECH_STEPS - 1, Math.floor(m * MECH_STEPS));
