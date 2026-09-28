# Meridian Hex

A scroll-driven 3D product site for the Meridian Hex, a hexagonal 0.5 mm mechanical pencil.
Scrolling takes the pencil through eight chapters: Reveal → Detail → Exploded → X-Ray →
Mechanism → Reassembly → Object → Lineup. It ends with a buy section.

## Stack

- Vite, React 19, TypeScript, `three@0.184.0` (bundled from npm, in its own chunk)
- Eight hand-written CSS files in `src/styles/`. No UI kit and no animation library.
- Python 3 + `numpy` + `pygltflib` for the asset pipeline

## Run

```bash
npm install
npm run dev          # local dev server
npm run build        # tsc + vite build
npm run assets       # rebuild the GLBs from the parametric model
npm run build && npm run qa   # Playwright QA: screenshots + checks in qa-output/
```

## Where things are

| Path | Role |
| --- | --- |
| `scripts/asset-processing/build_pencil_glb.py` | Source of truth for the geometry. Builds 42 named parts from math primitives and writes the desktop and mobile GLBs plus `mechanical-pencil.parts.json` |
| `src/three/config.ts` | Picks the quality tier (DPR cap, MSAA, shadows, which GLB to load) |
| `src/three/stage.ts` | Renderer, procedural PMREM studio, five-light rig, shadow catcher, composer |
| `src/three/assembly.ts` | Loads the GLB, builds the part registry, tunes materials, fades the shell for x-ray |
| `src/three/cameraRig.ts` | Camera and pencil-pose keyframes for landscape and portrait, sized to the viewport |
| `src/three/experience.ts` | Frame loop: scroll damping, explode/x-ray/mechanism motion, camera, DOM sync |
| `src/data/scroll.ts` | Scroll timeline and envelope functions |
| `src/data/content.ts` | All copy (prices are placeholders) |

## Known limitations

- `glb_to_blend.py` and the Blender round-trip are not included. Blender isn't available in
  this environment. The GLB is the shipped asset.
- The desktop GLB is about 21.7k triangles and 2 MB uncompressed. Serve it with gzip or brotli.
- Automated QA runs on SwiftShader (software GL) with reduced motion turned on, so it checks
  that the right frames render. It doesn't measure frame rate or motion feel on real GPUs.
