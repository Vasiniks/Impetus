/**
 * Labels pinned to live part positions in the exploded / x-ray views.
 * Positions are written by the frame loop (Experience.updateCallouts).
 */
const SHELL: [string, string][] = [
  ['noseCone', 'Nose cone'],
  ['gripUnderlay', '192-diamond grip'],
  ['barrel', 'Hex barrel'],
  ['clipRing', 'Clip'],
  ['button', 'Button cap'],
];
const INNER: [string, string][] = [
  ['brassInsert', 'Brass bushing'],
  ['clutchJaw0', 'Clutch jaws'],
  ['springMain', 'Return spring'],
  ['feedRod', 'Feed rod'],
  ['lead', '0.5 mm lead'],
  ['reservoir', 'Lead reservoir'],
];

export function Callouts() {
  return (
    <div className="callouts" aria-hidden="true">
      {SHELL.map(([part, label]) => (
        <div key={part} className="callout" data-callout={part} data-group="shell">
          <span className="callout__tag">{label}</span>
        </div>
      ))}
      {INNER.map(([part, label]) => (
        <div key={part} className="callout" data-callout={part} data-group="inner">
          <span className="callout__tag">{label}</span>
        </div>
      ))}
    </div>
  );
}
