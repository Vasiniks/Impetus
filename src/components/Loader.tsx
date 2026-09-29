import { useEffect, useState } from 'react';

interface Props {
  progress: number;
  ready: boolean;
  failed: boolean;
}

/** Loading as typography: a part counter assembling toward 42. */
export function Loader({ progress, ready, failed }: Props) {
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (!ready && !failed) return;
    const t = window.setTimeout(() => setGone(true), failed ? 2400 : 900);
    return () => window.clearTimeout(t);
  }, [ready, failed]);
  if (gone) return null;

  const parts = Math.round(progress * 42);
  return (
    <div
      className="loader"
      data-state={failed ? 'failed' : ready ? 'ready' : 'loading'}
      role="status"
      aria-live="polite"
    >
      <div className="loader__inner">
        <span className="loader__name">Impetus</span>
        <span className="loader__count" aria-hidden="true">
          {String(parts).padStart(2, '0')}
          <span className="loader__of">/42</span>
        </span>
        <span className="loader__bar" aria-hidden="true">
          <span style={{ transform: `scaleX(${progress})` }} />
        </span>
        <span className="loader__caption">
          {failed ? '3D view unavailable on this device — the page still reads top to bottom.' : ready ? 'Assembled' : 'Assembling parts'}
        </span>
      </div>
    </div>
  );
}
