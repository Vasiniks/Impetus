import { CHAPTERS } from '../data/scroll';

interface Props {
  chapter: number;
  atEnd: boolean;
  onGo(i: number): void;
}

/** Bottom "next chapter" control: always says where the next scroll goes. */
export function Guide({ chapter, atEnd, onGo }: Props) {
  const next = chapter + 1;
  const label = next < CHAPTERS.length ? CHAPTERS[next] : 'Own one';
  return (
    <button
      type="button"
      className="guide"
      data-hidden={atEnd || undefined}
      tabIndex={atEnd ? -1 : 0}
      onClick={() => onGo(next)}
    >
      <span className="guide__k">Next</span>
      <span className="guide__v">{label}</span>
      <svg viewBox="0 0 12 12" aria-hidden="true">
        <path d="M6 1v9M2 6.5 6 10.5l4-4" />
      </svg>
    </button>
  );
}
