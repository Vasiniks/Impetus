import type { CSSProperties } from 'react';
import { currency, lineup, variants } from '../data/content';

interface Props {
  active: number;
  onChoose(i: number): void;
}

/** Vertical scroll drives the track sideways (see Experience.updateDom). */
export function Lineup({ active, onChoose }: Props) {
  return (
    <section className="chapter chapter--lineup" data-scene="lineup" aria-labelledby="lineup-title">
      <div className="sticky lineup">
        <header className="lineup__head" data-fade>
          <p className="label">
            <span>{lineup.index}</span>Lineup
          </p>
          <h2 id="lineup-title">{lineup.title}</h2>
          <p>{lineup.body}</p>
        </header>
        <div className="lineup__viewport">
          <ol className="lineup__track" data-lineup-track>
            {variants.map((v, i) => (
              <li key={v.id} className="variant" data-active={i === active || undefined}>
                <span className="variant__swatch" style={{ '--c': v.color } as CSSProperties} aria-hidden="true" />
                <span className="variant__index">{String(i + 1).padStart(2, '0')} / {String(variants.length).padStart(2, '0')}</span>
                <h3 className="variant__name">{v.name}</h3>
                <dl className="variant__spec">
                  <div><dt>Barrel</dt><dd>{v.finish}</dd></div>
                  <div><dt>Mechanism</dt><dd>{lineup.shared}</dd></div>
                </dl>
                <p className="variant__note">{v.distinction}</p>
                <div className="variant__foot">
                  <span className="variant__price">{currency(v.price)}</span>
                  <button type="button" className="button button--ghost" onClick={() => onChoose(i)}>
                    Choose {v.name}
                  </button>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
