import { useEffect, useState, type CSSProperties } from 'react';
import { buy, currency, variants } from '../data/content';

interface Props {
  variantIdx: number;
  onVariant(i: number): void;
}

type State = 'idle' | 'busy' | 'done';

export function Buy({ variantIdx, onVariant }: Props) {
  const [state, setState] = useState<State>('idle');
  const v = variants[variantIdx];

  useEffect(() => {
    if (state !== 'busy') return;
    const t = window.setTimeout(() => setState('done'), 1100);
    return () => window.clearTimeout(t);
  }, [state]);

  return (
    <section id="buy" className="chapter chapter--buy" data-scene="buy" aria-labelledby="buy-title">
      <div className="buy">
        <form
          className="buy__panel"
          onSubmit={(e) => {
            e.preventDefault();
            if (state === 'idle') setState('busy');
          }}
        >
          <p className="label"><span>09</span>Own one</p>
          <h2 id="buy-title" className="buy__title">{buy.title}</h2>
          <p className="buy__price" aria-live="polite">
            <span data-testid="price">{currency(v.price)}</span>
            <span className="buy__finish">{v.name}</span>
          </p>
          <fieldset className="finishes">
            <legend>Finish</legend>
            {variants.map((opt, i) => (
              <label key={opt.id} className="finish" data-checked={i === variantIdx || undefined}>
                <input
                  type="radio"
                  name="finish"
                  value={opt.id}
                  checked={i === variantIdx}
                  onChange={() => {
                    onVariant(i);
                    setState('idle');
                  }}
                />
                <span className="finish__chip" style={{ '--c': opt.color } as CSSProperties} aria-hidden="true" />
                <span className="finish__name">{opt.name}</span>
              </label>
            ))}
          </fieldset>
          <button type="submit" className="button button--solid" data-state={state} disabled={state === 'busy'}>
            {state === 'busy' && <span className="spinner" aria-hidden="true" />}
            <span>{state === 'done' ? `${v.name} added` : state === 'busy' ? 'Adding' : `${buy.cta} — ${currency(v.price)}`}</span>
          </button>
          <p className="caption">{buy.note}</p>
        </form>
      </div>
      <footer className="footer">
        <span>Impetus</span>
        <span>Built from a parametric model of 42 parts</span>
      </footer>
    </section>
  );
}
