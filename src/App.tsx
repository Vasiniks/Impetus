import { useCallback, useEffect, useRef, useState } from 'react';
import { Experience } from './three/experience';
import { prefersReducedMotion } from './three/config';
import { variants } from './data/content';
import { Loader } from './components/Loader';
import { Nav } from './components/Nav';
import {
  Hero,
  Detail,
  Exploded,
  Xray,
  Mechanism,
  Reassembly,
  Philosophy,
} from './components/Chapters';
import { Lineup } from './components/Lineup';
import { Buy } from './components/Buy';

declare global {
  interface Window {
    __meridian?: Experience;
  }
}

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const expRef = useRef<Experience | null>(null);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [lineupIdx, setLineupIdx] = useState(0);
  const [variantIdx, setVariantIdx] = useState(0);
  const [motion, setMotion] = useState(() => !prefersReducedMotion());

  useEffect(() => {
    const canvas = canvasRef.current!;
    let exp: Experience;
    try {
      exp = new Experience(canvas, {
        onProgress: setProgress,
        onReady: () => setReady(true),
        onError: (e) => {
          console.error(e);
          setFailed(true);
        },
        onChapter: setChapter,
        onLineup: (i) => {
          setLineupIdx(i);
          setVariantIdx(i);
        },
      });
    } catch (e) {
      console.error(e);
      setFailed(true);
      return;
    }
    expRef.current = exp;
    window.__meridian = exp;
    exp.init(variants[0].color);
    return () => {
      exp.dispose();
      expRef.current = null;
      delete window.__meridian;
    };
  }, []);

  useEffect(() => {
    expRef.current?.setVariant(variants[variantIdx].color);
  }, [variantIdx]);

  useEffect(() => {
    expRef.current?.setMotion(motion);
    document.documentElement.toggleAttribute('data-reduced-motion', !motion);
  }, [motion]);

  const choose = useCallback((i: number) => {
    setVariantIdx(i);
    document.getElementById('buy')?.scrollIntoView({ behavior: motion ? 'smooth' : 'auto' });
  }, [motion]);

  return (
    <>
      <a className="skip-link" href="#buy">Skip to purchase</a>
      <canvas ref={canvasRef} className="stage-canvas" aria-hidden="true" />
      <p className="sr-only">
        A three-dimensional Meridian Hex pencil follows the page: it is shown whole, taken apart into
        its 42 parts, seen through its barrel, clicked to advance the lead, and put back together.
      </p>
      <Loader progress={progress} ready={ready} failed={failed} />
      <Nav chapter={chapter} motion={motion} onToggleMotion={() => setMotion((m) => !m)} />
      <main>
        <Hero />
        <Detail />
        <Exploded />
        <Xray />
        <Mechanism />
        <Reassembly />
        <Philosophy />
        <Lineup active={lineupIdx} onChoose={choose} />
        <Buy variantIdx={variantIdx} onVariant={setVariantIdx} />
      </main>
    </>
  );
}
