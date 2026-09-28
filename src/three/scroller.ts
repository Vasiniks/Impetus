import Lenis from 'lenis';

/**
 * Smooth scrolling + scroll guiding.
 *
 * Lenis interpolates wheel input so window.scrollY itself glides; the frame
 * loop drives it (no second rAF). When input goes idle near a "stop" — a
 * chapter's hold pose, a mechanism step, a lineup card — the page settles onto
 * it with a short ease-out, biased toward the direction the reader was moving.
 */

const IDLE_MS = 140;
const INPUT_EVENTS = ['wheel', 'touchstart', 'touchmove', 'keydown', 'pointerdown'] as const;
const easeOutQuart = (t: number) => 1 - Math.pow(1 - t, 4);
const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export class Scroller {
  private lenis: Lenis | null = null;
  private stops: number[] = [];
  private lastInput = 0;
  private lastY = 0;
  private dir = 0;
  private settled = true;
  private auto = false;

  constructor(enabled: boolean) {
    this.onScroll = this.onScroll.bind(this);
    this.onInput = this.onInput.bind(this);
    window.addEventListener('scroll', this.onScroll, { passive: true });
    for (const ev of INPUT_EVENTS) window.addEventListener(ev, this.onInput, { passive: true });
    this.setEnabled(enabled);
  }

  get smooth(): boolean {
    return this.lenis !== null;
  }

  /** True while Lenis is still gliding toward its target. */
  get moving(): boolean {
    return !!this.lenis && this.lenis.isScrolling !== false;
  }

  setEnabled(on: boolean): void {
    if (on && !this.lenis) {
      this.lenis = new Lenis({ autoRaf: false, lerp: 0.12, wheelMultiplier: 0.9, anchors: true });
    } else if (!on && this.lenis) {
      this.lenis.destroy();
      this.lenis = null;
    }
  }

  get stopList(): readonly number[] {
    return this.stops;
  }

  /** Scroll positions (px) the page may settle on. */
  setStops(stops: number[]): void {
    this.stops = stops.slice().sort((a, b) => a - b);
  }

  raf(now: number): void {
    this.lenis?.raf(now);
    if (!this.lenis || this.settled || this.auto) return;
    if (now - this.lastInput < IDLE_MS || this.lenis.isScrolling === 'smooth') return;
    this.settled = true;
    const y = window.scrollY;
    const vh = window.innerHeight;
    // Guide forward: finish the move to the next stop in the reader's
    // direction; only pull back against their motion when nearly there.
    let best = NaN;
    let bestD = Infinity;
    for (const s of this.stops) {
      const d = s - y;
      const ahead = Math.sign(d) === this.dir;
      const reach = ahead ? Infinity : vh * 0.16;
      const ad = Math.abs(d) * (ahead ? 0.7 : 1);
      if (Math.abs(d) <= reach && ad < bestD) {
        bestD = ad;
        best = s;
      }
    }
    if (Number.isNaN(best) || Math.abs(best - y) < 2) return;
    const dist = Math.abs(best - y);
    this.glide(best, Math.min(0.9, 0.35 + dist / vh * 0.5), easeOutQuart);
  }

  /** Programmatic, eased scroll (nav, "next" button). */
  scrollTo(y: number): void {
    if (!this.lenis) {
      window.scrollTo(0, y);
      return;
    }
    const dist = Math.abs(y - window.scrollY) / window.innerHeight;
    this.glide(y, Math.min(2.2, 0.6 + dist * 0.28), easeInOutCubic);
  }

  private glide(y: number, duration: number, easing: (t: number) => number): void {
    if (!this.lenis) return;
    this.auto = true;
    this.lenis.scrollTo(y, {
      duration,
      easing,
      onComplete: () => {
        this.auto = false;
        this.settled = true;
      },
    });
  }

  private onScroll(): void {
    const y = window.scrollY;
    if (!this.auto) {
      this.lastInput = performance.now();
      this.settled = false;
      if (y !== this.lastY) this.dir = Math.sign(y - this.lastY);
    }
    this.lastY = y;
  }

  /** Any wheel/touch/key input during a glide hands control straight back. */
  private onInput(): void {
    this.auto = false;
    this.settled = false;
    this.lastInput = performance.now();
  }

  dispose(): void {
    window.removeEventListener('scroll', this.onScroll);
    for (const ev of INPUT_EVENTS) window.removeEventListener(ev, this.onInput);
    this.lenis?.destroy();
    this.lenis = null;
  }
}
