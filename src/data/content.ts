/**
 * Copy for every chapter. Figures quoted here are read off the parametric
 * model in scripts/asset-processing/build_pencil_glb.py (part count, lattice
 * count, lead size) — nothing else is claimed.
 *
 * Prices are placeholders for the demo storefront, not real pricing.
 */

export const hero = {
  eyebrow: 'Mechanical pencil · 0.5 mm',
  title: 'Meridian Hex',
  lede: 'Six flat faces, forty-two parts, one click.',
  cue: 'Scroll to take it apart',
};

export const detail = {
  index: '02',
  title: 'A grip you can count.',
  body: '192 raised diamonds stand on the six faces of the grip section. Each face ends in a full diamond and a machined rail, so the pattern stops on purpose instead of running out.',
  note: 'DLC-coated sleeve · steel rings above and below',
};

export const exploded = {
  index: '03',
  title: 'Forty-two parts.',
  body: 'The shell stays on the axis. The mechanism steps out beside it, in the order it is assembled.',
  legend: [
    { group: 'Shell', items: ['Nose tip', 'Nose cone', 'Grip rings', 'Diamond lattice', 'Hex barrel', 'Clip', 'Top collar', 'Button cap'] },
    { group: 'Mechanism', items: ['Lead sleeve', 'Lead retainer', 'Brass bushing', 'Thread ring', 'Clutch ring', 'Three clutch jaws', 'Return spring', 'Mid shaft', 'Feed rod'] },
    { group: 'Feed', items: ['0.5 mm lead', 'Lead reservoir', 'Spare leads', 'Eraser'] },
  ],
};

export const xray = {
  index: '04',
  title: 'Seen through the barrel.',
  body: 'With the shell reduced to its outline, what is left is the part you never see: a lead tube, a return spring and a three-jaw clutch.',
};

export const mechanism = {
  index: '05',
  title: 'One click, five movements.',
  steps: [
    { k: 'Press', t: 'The button drives the reservoir and clutch forward as one.' },
    { k: 'Compress', t: 'The return spring loads between its seat and stop.' },
    { k: 'Release', t: 'The clutch ring meets its stop. The three jaws open.' },
    { k: 'Advance', t: 'The lead is left further out than it started.' },
    { k: 'Reset', t: 'The spring returns the clutch. The ring closes the jaws on the lead again.' },
  ],
};

export const reassembly = {
  index: '06',
  title: 'Back on the axis.',
  body: 'Every part returns along the line it left on. Nothing is glued; everything is held by thread, spring or fit.',
};

export const philosophy = {
  index: '07',
  statements: [
    { k: 'Six faces', t: 'A hexagon sits still on a desk and tells your fingers where they are without looking.' },
    { k: 'Metal where it matters', t: 'Steel at the nose and grip rings, where the pencil meets paper and hand. Anodized aluminium for the length between.' },
    { k: 'Serviceable', t: 'The nose unthreads, the cap lifts off, the eraser pulls out. The mechanism is made to be reached.' },
  ],
};

export interface Variant {
  id: string;
  name: string;
  finish: string;
  /** sRGB hex of the anodized barrel. */
  color: string;
  distinction: string;
  price: number;
}

export const variants: Variant[] = [
  { id: 'graphite', name: 'Graphite', finish: 'Anodized aluminium, graphite', color: '#34363b', distinction: 'The reference finish. Dark enough to disappear in the hand.', price: 48 },
  { id: 'cobalt', name: 'Cobalt', finish: 'Anodized aluminium, cobalt', color: '#27416f', distinction: 'Deep blue that turns almost black away from the light.', price: 48 },
  { id: 'sage', name: 'Sage', finish: 'Anodized aluminium, sage', color: '#667560', distinction: 'A muted green-grey that reads warm on paper.', price: 48 },
  { id: 'oxide', name: 'Oxide', finish: 'Anodized aluminium, oxide red', color: '#7d3527', distinction: 'Iron-oxide red. The easiest one to find on a crowded desk.', price: 52 },
];

export const lineup = {
  index: '08',
  title: 'Four finishes. One mechanism.',
  body: 'Every Meridian Hex shares the same 42 parts. Only the barrel anodizing changes.',
  shared: 'Steel nose · DLC grip · 0.5 mm clutch',
};

export const buy = {
  title: 'Meridian Hex',
  note: 'Demonstration storefront — no order is placed.',
  cta: 'Add to bag',
};

export const currency = (n: number) => `€${n}`;
