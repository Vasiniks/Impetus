import { CHAPTERS } from '../data/scroll';

interface Props {
  chapter: number;
  motion: boolean;
  onToggleMotion(): void;
  onGo(i: number): void;
}

export function Nav({ chapter, motion, onToggleMotion, onGo }: Props) {
  return (
    <header className="nav">
      <a
        className="nav__mark"
        href="#top"
        aria-label="Impetus, back to top"
        onClick={(e) => {
          e.preventDefault();
          onGo(0);
        }}
      >
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path d="M16 3 27.3 9.5v13L16 29 4.7 22.5v-13z" />
        </svg>
        Impetus
      </a>
      <ol className="nav__chapters" aria-label="Chapters">
        {CHAPTERS.map((c, i) => (
          <li key={c} data-active={i === chapter || undefined}>
            <button type="button" onClick={() => onGo(i)} aria-current={i === chapter ? 'step' : undefined}>
              <span className="nav__bar" data-chapter-bar aria-hidden="true" />
              <span className="nav__num">{String(i + 1).padStart(2, '0')}</span>
              <span className="nav__label">{c}</span>
            </button>
          </li>
        ))}
      </ol>
      <span className="nav__current" aria-hidden="true">
        {String(chapter + 1).padStart(2, '0')} <span>{CHAPTERS[chapter]}</span>
      </span>
      <div className="nav__actions">
        <button type="button" className="nav__motion" aria-pressed={!motion} onClick={onToggleMotion}>
          {motion ? 'Reduce motion' : 'Motion off'}
        </button>
        <a
          className="nav__buy"
          href="#buy"
          onClick={(e) => {
            e.preventDefault();
            onGo(8);
          }}
        >
          Buy
        </a>
      </div>
    </header>
  );
}
