import { detail, exploded, hero, mechanism, philosophy, reassembly, xray } from '../data/content';
import { CHAPTERS } from '../data/scroll';

function Label({ index, chapter }: { index: string; chapter: number }) {
  return (
    <p className="label">
      <span>{index}</span>
      {CHAPTERS[chapter]}
    </p>
  );
}

export function Hero() {
  return (
    <section id="top" className="chapter chapter--hero" data-scene="hero" aria-labelledby="hero-title">
      <div className="sticky">
        <div className="hero__copy" data-fade>
          <p className="label">{hero.eyebrow}</p>
          <h1 id="hero-title" className="display">{hero.title}</h1>
          <p className="hero__lede">{hero.lede}</p>
        </div>
        <p className="hero__cue" data-fade aria-hidden="true">
          <span className="hero__cue-line" />
          {hero.cue}
        </p>
      </div>
    </section>
  );
}

export function Detail() {
  return (
    <section className="chapter chapter--detail" data-scene="detail" aria-labelledby="detail-title">
      <div className="sticky">
        <div className="copy copy--right" data-fade>
          <Label index={detail.index} chapter={1} />
          <h2 id="detail-title">{detail.title}</h2>
          <p>{detail.body}</p>
          <p className="caption">{detail.note}</p>
        </div>
      </div>
    </section>
  );
}

export function Exploded() {
  return (
    <section className="chapter chapter--exploded" data-scene="exploded" aria-labelledby="exploded-title">
      <div className="sticky">
        <div className="copy copy--top" data-fade>
          <Label index={exploded.index} chapter={2} />
          <h2 id="exploded-title">{exploded.title}</h2>
          <p>{exploded.body}</p>
        </div>
        <dl className="legend" data-fade="2">
          {exploded.legend.map((g) => (
            <div key={g.group} className="legend__group">
              <dt>{g.group}</dt>
              <dd>
                <ul>
                  {g.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function Xray() {
  return (
    <section className="chapter chapter--xray" data-scene="xray" aria-labelledby="xray-title">
      <div className="sticky">
        <div className="copy copy--bottom" data-fade>
          <Label index={xray.index} chapter={3} />
          <h2 id="xray-title">{xray.title}</h2>
          <p>{xray.body}</p>
        </div>
      </div>
    </section>
  );
}

export function Mechanism() {
  return (
    <section className="chapter chapter--mechanism" data-scene="mechanism" aria-labelledby="mech-title">
      <div className="sticky">
        <div className="copy copy--top" data-fade>
          <Label index={mechanism.index} chapter={4} />
          <h2 id="mech-title">{mechanism.title}</h2>
        </div>
        <ol className="steps" data-fade="2">
          {mechanism.steps.map((st, i) => (
            <li key={st.k} data-mech-step={i}>
              <span className="steps__n">{i + 1}</span>
              <span className="steps__k">{st.k}</span>
              <span className="steps__t">{st.t}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Reassembly() {
  return (
    <section className="chapter chapter--reassembly" data-scene="reassembly" aria-labelledby="re-title">
      <div className="sticky">
        <div className="copy copy--bottom" data-fade>
          <Label index={reassembly.index} chapter={5} />
          <h2 id="re-title">{reassembly.title}</h2>
          <p>{reassembly.body}</p>
        </div>
      </div>
    </section>
  );
}

export function Philosophy() {
  const n = philosophy.statements.length;
  return (
    <section className="chapter chapter--philosophy" data-scene="philosophy" aria-labelledby="ph-title">
      <h2 id="ph-title" className="sr-only">Why it looks like this</h2>
      <div className="sticky">
        {philosophy.statements.map((st, i) => {
          const a = 0.04 + (i / n) * 0.92;
          const b = 0.04 + ((i + 1) / n) * 0.92;
          return (
            <div key={st.k} className="statement" data-fade data-range={`${a.toFixed(3)},${b.toFixed(3)}`}>
              <p className="label">
                <span>{philosophy.index}</span>
                {String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
              </p>
              <h3>{st.k}</h3>
              <p>{st.t}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
