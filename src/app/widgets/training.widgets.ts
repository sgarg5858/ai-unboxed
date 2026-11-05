import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { plotPath } from '../shared/lib/math';
import { Slider } from '../shared/slider/slider';

const ce = { sx: (p: number) => 40 + p * 340, sy: (l: number) => 170 - (Math.min(l, 5) / 5) * 150 };

@Component({
  selector: 'w-cross-entropy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Slider],
  host: { class: 'contents' },
  template: `
    <div class="panel">
      <app-slider
        label="p(correct)"
        [min]="0.01"
        [max]="1"
        [step]="0.01"
        [(value)]="p"
        [format]="fix2"
      />
      <svg viewBox="0 0 400 200" width="100%" role="img" aria-label="Loss curve minus log p">
        <line x1="40" y1="170" x2="380" y2="170" stroke="var(--line)" />
        <line x1="40" y1="20" x2="40" y2="170" stroke="var(--line)" />
        @for (t of [0, 0.5, 1]; track t) {
          <text [attr.x]="sx(t)" y="188" text-anchor="middle">{{ t }}</text>
        }
        @for (t of [0, 2.5, 5]; track t) {
          <text x="32" [attr.y]="sy(t) + 4" text-anchor="end">{{ t }}</text>
        }
        <path [attr.d]="curve" fill="none" stroke="var(--accent)" stroke-width="2.2" />
        <circle [attr.cx]="sx(p())" [attr.cy]="sy(loss())" r="6" fill="var(--heat)" />
      </svg>
      <div class="stat">
        <div>
          <b>{{ loss().toFixed(2) }}</b
          ><span>loss = −ln p</span>
        </div>
        <div>
          <b>{{ exp(loss()).toFixed(1) }}</b
          ><span>perplexity = e^loss</span>
        </div>
      </div>
    </div>
  `,
})
export class CrossEntropyWidget {
  protected readonly p = signal(0.25);
  protected readonly loss = computed(() => -Math.log(this.p()));
  protected readonly sx = ce.sx;
  protected readonly sy = ce.sy;
  protected readonly exp = Math.exp;
  protected readonly fix2 = (v: number) => v.toFixed(2);
  protected readonly curve = plotPath((q) => -Math.log(q), 0.01, 1, 99, ce.sx, ce.sy);
}

const gd = {
  f: (w: number) => (w - 3) ** 2,
  sx: (w: number) => 40 + ((w + 2) / 10) * 340,
  sy: (l: number) => 185 - (Math.min(l, 30) / 30) * 165,
};

@Component({
  selector: 'w-gradient-descent',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Slider],
  host: { class: 'contents' },
  template: `
    <div class="panel">
      <app-slider
        label="learning rate"
        [min]="0.05"
        [max]="1.1"
        [step]="0.05"
        [value]="lr()"
        (valueChange)="setLr($event)"
        [format]="fix2"
      />
      <svg viewBox="0 0 400 210" width="100%" role="img" aria-label="Loss bowl with descent steps">
        <line x1="40" y1="185" x2="380" y2="185" stroke="var(--line)" />
        <path [attr.d]="bowl" fill="none" stroke="var(--accent)" stroke-width="2" />
        <text [attr.x]="sx(3)" y="202" text-anchor="middle">min</text>
        @for (s of segments(); track $index) {
          <line
            [attr.x1]="s[0]"
            [attr.y1]="s[1]"
            [attr.x2]="s[2]"
            [attr.y2]="s[3]"
            stroke="var(--heat)"
            stroke-width="1.2"
            stroke-dasharray="3 3"
          />
        }
        @for (pt of points(); track $index) {
          <circle
            [attr.cx]="sx(pt)"
            [attr.cy]="sy(f(pt))"
            [attr.r]="$last ? 6 : 3"
            fill="var(--heat)"
          />
        }
      </svg>
      <div class="row">
        <button class="btn on" (click)="stepOnce()">Take a step</button>
        <button class="btn" (click)="path.set([-1])">Reset</button>
        <span class="cap">step {{ path().length - 1 }} · loss {{ lossText() }}</span>
      </div>
    </div>
  `,
})
export class GradientDescentWidget {
  protected readonly lr = signal(0.3);
  protected readonly path = signal([-1]);
  protected readonly f = gd.f;
  protected readonly sx = gd.sx;
  protected readonly sy = gd.sy;
  protected readonly fix2 = (v: number) => v.toFixed(2);
  protected readonly bowl = plotPath(gd.f, -2, 8, 100, gd.sx, gd.sy);
  protected readonly points = computed(() => this.path().filter((w) => w > -2.5 && w < 8.5));
  protected readonly segments = computed(() => {
    const p = this.points();
    return p.slice(1).map((w, i) => [gd.sx(p[i]), gd.sy(gd.f(p[i])), gd.sx(w), gd.sy(gd.f(w))]);
  });
  protected readonly lossText = computed(() => {
    const l = gd.f(this.path()[this.path().length - 1]);
    return l > 999 ? 'diverged' : l.toFixed(3);
  });
  protected setLr(v: number) {
    this.lr.set(v);
    this.path.set([-1]);
  }
  protected stepOnce() {
    const w = this.path()[this.path().length - 1];
    this.path.update((p) => [...p, w - this.lr() * 2 * (w - 3)]);
  }
}

@Component({
  selector: 'w-loss-curve',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  template: `
    <div class="panel">
      <svg
        viewBox="0 0 400 200"
        width="100%"
        role="img"
        aria-label="Typical loss curve falling quickly then flattening"
      >
        <line x1="40" y1="170" x2="380" y2="170" stroke="var(--line)" />
        <line x1="40" y1="20" x2="40" y2="170" stroke="var(--line)" />
        <path [attr.d]="d" fill="none" stroke="var(--accent)" stroke-width="2" />
        <text x="44" y="16">loss</text>
        <text x="380" y="188" text-anchor="end">training tokens →</text>
        <text [attr.x]="labelX" [attr.y]="labelY">≈ ln V at start</text>
      </svg>
      <p class="cap">
        Illustrative shape: steep early drop, then a long slow grind. Scaling laws show loss falls
        predictably as you add parameters, data and compute.
      </p>
    </div>
  `,
})
export class LossCurveWidget {
  private readonly sx = (t: number) => 40 + t * 340;
  private readonly sy = (l: number) => 170 - ((l - 1.6) / (10.8 - 1.6)) * 150;
  protected readonly labelX = this.sx(0.02) + 6;
  protected readonly labelY = this.sy(10.6);
  protected readonly d = Array.from({ length: 121 }, (_, i) => {
    const t = i / 120;
    const l =
      1.8 + 9 * Math.exp(-t * 9) + 0.35 * Math.exp(-t * 1.5) + (i % 7 === 3 ? 0.08 : 0) * (1 - t);
    return (i ? 'L' : 'M') + this.sx(t).toFixed(1) + ' ' + this.sy(l).toFixed(1);
  }).join('');
}
