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
import { Guide } from './components/Guide';
import { Callouts } from './components/Callouts';

declare global {
  interface Window {
    __impetus?: Experience;
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
  const [atEnd, setAtEnd] = useState(false);

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
        onEnd: setAtEnd,
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
    window.__impetus = exp;
    exp.init(variants[0].color);
    return () => {
      exp.dispose();
      expRef.current = null;
      delete window.__impetus;
    };
  }, []);

  useEffect(() => {
    expRef.current?.setVariant(variants[variantIdx].color);
  }, [variantIdx]);

  useEffect(() => {
    expRef.current?.setMotion(motion);
    document.documentElement.toggleAttribute('data-reduced-motion', !motion);
  }, [motion]);

  const go = useCallback((i: number) => expRef.current?.goToChapter(i), []);
  const choose = useCallback((i: number) => {
    setVariantIdx(i);
    go(8);
  }, [go]);

  return (
    <>
      <a className="skip-link" href="#buy">Skip to purchase</a>
      <canvas ref={canvasRef} className="stage-canvas" aria-hidden="true" />
      <p className="sr-only">
        A three-dimensional Impetus pencil follows the page: it is shown whole, taken apart into
        its 42 parts, seen through its barrel, clicked to advance the lead, and put back together.
      </p>
      <Loader progress={progress} ready={ready} failed={failed} />
      <Callouts />
      <Nav chapter={chapter} motion={motion} onToggleMotion={() => setMotion((m) => !m)} onGo={go} />
      <Guide chapter={chapter} atEnd={atEnd} onGo={go} />
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
