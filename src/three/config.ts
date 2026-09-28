export type QualityTier = 'high' | 'low';

export interface Quality {
  tier: QualityTier;
  dpr: number;
  msaa: number;
  shadows: boolean;
  shadowMapSize: number;
  modelUrl: string;
  envResolution: number;
}

export function detectQuality(): Quality {
  const touch = matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  const small = Math.min(screen.width, screen.height) < 820;
  const cores = navigator.hardwareConcurrency || 8;
  const forced = new URLSearchParams(location.search).get('quality');
  let tier: QualityTier = (touch && small) || cores <= 4 ? 'low' : 'high';
  if (forced === 'high' || forced === 'low') tier = forced;

  const base = import.meta.env.BASE_URL;
  return tier === 'high'
    ? {
        tier,
        dpr: Math.min(devicePixelRatio || 1, 2),
        msaa: 4,
        shadows: true,
        shadowMapSize: 2048,
        modelUrl: `${base}models/mechanical-pencil.glb`,
        envResolution: 256,
      }
    : {
        tier,
        dpr: Math.min(devicePixelRatio || 1, 1.5),
        msaa: 0,
        shadows: false,
        shadowMapSize: 0,
        modelUrl: `${base}models/mechanical-pencil-mobile.glb`,
        envResolution: 128,
      };
}

export function prefersReducedMotion(): boolean {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}
