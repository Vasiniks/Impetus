# Impetus

A scroll-driven 3D product site for Impetus, a hexagonal 0.5 mm mechanical pencil.
Scrolling takes the pencil through eight chapters: Reveal → Detail → Exploded → X-Ray →
Mechanism → Reassembly → Object → Lineup. It ends with a buy section.

**Live site:** https://vasiniks.github.io/Impetus/

## Scrolling and navigation

- **Smooth scrolling:** [Lenis](https://github.com/darkroomengineering/lenis) smooths wheel input.
  It runs inside the same frame loop as the 3D scene, so the page and the scene move together.
- **Scroll guiding:** when you stop scrolling, the page glides on to the next stop in the
  direction you were going. Stops are each chapter's main pose, the five mechanism steps, the
  three "Object" statements and the four lineup cards. It only pulls you back if you're almost
  at a stop behind you.
- **Navigation:** chapter names in the top bar are clickable, and each one fills in as you scroll
  through it. The "Next" button at the bottom always shows where the next chapter is.
- With reduced motion (your system setting or the "Reduce motion" button), smoothing and
  guiding turn off and the page scrolls normally.

## Exploded view and x-ray

- **Explode:** the mechanism steps down into its rows first, then the parts spread along the
  axis, with the outermost parts moving first. Threaded parts (nose cone, thread ring, grip
  rings, grip, button cap) turn as they come off.
- **Labels:** labels follow key parts on screen during the exploded and x-ray chapters
  (landscape only).
- **X-ray:** a scan line sweeps from the button to the tip. Behind it the body stays solid
  metal. Past it the body turns into a blueprint-style outline with its edges drawn in, and the
  mechanism inside is lit up.

## Stack

- Vite, React 19, TypeScript, `three@0.184.0` (bundled from npm, in its own chunk)
- Eight hand-written CSS files in `src/styles/`. No UI kit. The only animation dependency is
  Lenis for smooth scrolling.
- Python 3 + `numpy` + `pygltflib` for the asset pipeline

## Run

```bash
npm install
npm run dev          # local dev server
npm run build        # tsc + vite build
npm run assets       # rebuild the GLBs from the parametric model
npm run build && npm run qa   # Playwright QA: screenshots + checks in qa-output/, plus a motion-on pass
```

## Deployment (GitHub Pages)

`.github/workflows/deploy-pages.yml` builds and publishes the site on every push to `main`.
You can also run it by hand from the Actions tab (**Deploy to GitHub Pages → Run workflow**).

- The repository's Pages source must be **GitHub Actions**
  (Settings → Pages → Build and deployment → Source).
- Pages serves the site from `/Impetus/`. The workflow passes `BASE_PATH=/<repo name>/` to the
  build, and `vite.config.ts` uses it as the base path. Local builds default to `/`.
- To preview a Pages build locally:

  ```bash
  BASE_PATH=/Impetus/ npm run build
  BASE_PATH=/Impetus/ npm run preview   # open http://localhost:4173/Impetus/
  QA_URL=http://localhost:4173/Impetus npm run qa
  ```

## Where things are

| Path | Role |
| --- | --- |
| `scripts/asset-processing/build_pencil_glb.py` | Source of truth for the geometry. Builds 42 named parts from math primitives and writes the desktop and mobile GLBs plus `mechanical-pencil.parts.json` |
| `src/three/config.ts` | Picks the quality tier (DPR cap, MSAA, shadows, which GLB to load) |
| `src/three/stage.ts` | Renderer, procedural PMREM studio, five-light rig, shadow catcher, composer |
| `src/three/assembly.ts` | Loads the GLB, builds the part registry, tunes materials, draws the x-ray scan |
| `src/three/cameraRig.ts` | Camera and pencil-pose keyframes for landscape and portrait, sized to the viewport |
| `src/three/experience.ts` | Frame loop: explode/x-ray/mechanism motion, camera, labels, DOM sync |
| `src/three/scroller.ts` | Lenis smooth scrolling, scroll stops and settling, chapter navigation |
| `src/data/scroll.ts` | Scroll timeline and envelope functions |
| `src/data/content.ts` | All copy (prices are placeholders) |

## Known limitations

- `glb_to_blend.py` and the Blender round-trip are not included. Blender isn't available in
  this environment. The GLB is the shipped asset.
- The desktop GLB is about 21.7k triangles and 2 MB uncompressed. Serve it with gzip or brotli.
- GitHub Pages doesn't let you set compression per file type, so the GLB is served however
  Pages decides to serve it.
- Automated QA runs on SwiftShader (software GL) with reduced motion turned on, so it checks
  that the right frames render. It doesn't measure frame rate or motion feel on real GPUs.
