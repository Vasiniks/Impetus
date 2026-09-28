// Browser QA against the real rendered site.
//   npm run build && npm run qa            (starts `vite preview` itself)
//   QA_URL=http://localhost:5173 npm run qa (use a running dev server)
// Writes screenshots + report.json to qa-output/.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';

const OUT = 'qa-output';
mkdirSync(OUT, { recursive: true });

const VIEWPORTS = (process.env.QA_VIEWPORTS || '1440x900,390x844')
  .split(',')
  .map((s) => s.split('x').map(Number));

const SHOTS = [
  ['hero', 0.3],
  ['detail', 1.4],
  ['exploded-start', 2.12],
  ['exploded', 2.6],
  ['xray', 3.6],
  ['mechanism-press', 4.42],
  ['mechanism-open', 4.58],
  ['reassembly', 5.3],
  ['final', 5.7],
  ['object', 6.5],
  ['lineup-start', 7.2],
  ['lineup-mid', 7.5],
  ['buy', 8.5],
];

let server;
let base = process.env.QA_URL;
if (!base) {
  base = 'http://localhost:4173';
  server = spawn('npx', ['vite', 'preview', '--port', '4173', '--strictPort'], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 2500));
}

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const report = { base, viewports: [] };
let failures = 0;
const fail = (msg) => {
  failures++;
  console.log('  FAIL', msg);
};

for (const [w, h] of VIEWPORTS) {
  const tag = `${w}x${h}`;
  console.log(`\n== ${tag}`);
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: 1,
    hasTouch: w < 800,
    isMobile: w < 800,
    // snap scroll damping so software-GL frames settle deterministically
    reducedMotion: process.env.QA_MOTION ? 'no-preference' : 'reduce',
  });
  const page = await ctx.newPage();
  const errors = [];
  const failed = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('requestfailed', (r) => failed.push(r.url()));

  await page.goto(`${base}/?quality=${process.env.QA_QUALITY || (w < 800 ? 'low' : 'high')}`);
  await page.waitForFunction(() => window.__meridian?.debugState().parts === 42, null, { timeout: 60000 });
  await page.waitForTimeout(1200);

  const labels = await page.$$eval('.nav__chapters li .nav__label', (els) => els.map((e) => e.textContent));
  const want = ['Reveal', 'Detail', 'Exploded', 'X-Ray', 'Mechanism', 'Reassembly', 'Object', 'Lineup'];
  if (JSON.stringify(labels) !== JSON.stringify(want)) fail(`chapter labels ${labels}`);

  const vp = { tag, shots: [], errors, failed };
  for (const [name, s] of SHOTS) {
    await page.evaluate((s) => {
      const secs = [...document.querySelectorAll('[data-scene]')];
      const i = Math.floor(s);
      const r = secs[i].getBoundingClientRect();
      const top = r.top + scrollY;
      scrollTo(0, top + (s - i) * r.height - innerHeight / 2);
    }, s);
    await page.waitForFunction((s) => Math.abs(window.__meridian.debugState().s - s) < 0.02 || s > 8.3, s, { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(900);
    const st = await page.evaluate(() => window.__meridian.debugState());
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
    if (overflow) fail(`${tag} ${name}: horizontal overflow`);
    const file = `${OUT}/${tag}-${name}.png`;
    await page.screenshot({ path: file });
    vp.shots.push({ name, s: st.s, chapter: st.chapter, ndc: st.ndc, calls: st.calls, tris: st.triangles });
    const n = st.ndc;
    console.log(`  ${name.padEnd(16)} s=${st.s.toFixed(2)} ch=${st.chapter} ndc x[${n.x0.toFixed(2)},${n.x1.toFixed(2)}] y[${n.y0.toFixed(2)},${n.y1.toFixed(2)}] calls=${st.calls}`);
    if (name === 'exploded' && (n.x0 < -1.02 || n.x1 > 1.02 || n.y0 < -1.02 || n.y1 > 1.02)) fail(`${tag}: exploded view leaves the frame`);
  }

  // variant switching recolors the live barrel and the price follows
  const before = await page.evaluate(() => window.__meridian.debugState().barrel);
  const label = page.locator('.finish').nth(1);
  await label.click();
  await page.waitForTimeout(1200);
  const after = await page.evaluate(() => window.__meridian.debugState().barrel);
  const price1 = await page.textContent('[data-testid=price]');
  await page.locator('.finish').nth(3).click();
  await page.waitForTimeout(300);
  const price3 = await page.textContent('[data-testid=price]');
  if (before === after) fail(`${tag}: barrel did not recolor (${before})`);
  if (price1 === price3) fail(`${tag}: price did not follow variant (${price1} / ${price3})`);
  await page.click('.buy__panel button[type=submit]');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/${tag}-buy-done.png` });
  const btn = await page.textContent('.buy__panel button[type=submit]');
  if (!/added/i.test(btn)) fail(`${tag}: buy flow did not complete (${btn})`);

  const real = errors.filter((e) => !/React DevTools/.test(e));
  if (real.length) fail(`${tag}: console errors ${JSON.stringify(real.slice(0, 5))}`);
  if (failed.length) fail(`${tag}: failed requests ${failed.join(', ')}`);
  report.viewports.push(vp);
  await ctx.close();
}

await browser.close();
server?.kill();
writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
console.log(failures ? `\n${failures} failure(s)` : '\nall checks passed');
process.exit(failures ? 1 : 0);
