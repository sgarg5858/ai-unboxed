import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { bytes } from '../shared/lib/format';
import { softmax } from '../shared/lib/math';
import { CANDS } from '../shared/lib/toy-model';
import { Slider } from '../shared/slider/slider';

const fix2 = (v: number) => v.toFixed(2);

@Component({
  selector: 'w-temperature',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Slider],
  host: { class: 'contents' },
  template: `
    <div class="panel">
      <app-slider
        label="temperature T"
        [min]="0.1"
        [max]="2.5"
        [step]="0.05"
        [(value)]="T"
        [format]="fix2"
      />
      <div style="margin-top:12px">
        @for (c of cands; track c[0]) {
          <div class="bar">
            <span>{{ c[0] }}</span>
            <div class="t"><i [style.width.%]="probs()[$index] * 100"></i></div>
            <span>{{ (probs()[$index] * 100).toFixed(1) }}%</span>
          </div>
        }
      </div>
    </div>
  `,
})
export class TemperatureWidget {
  protected readonly cands = CANDS;
  protected readonly fix2 = fix2;
  protected readonly T = signal(1);
  protected readonly probs = computed(() => softmax(CANDS.map((c) => c[1] / this.T())));
}

@Component({
  selector: 'w-sampling',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Slider],
  host: { class: 'contents' },
  template: `
    <div class="panel">
      <app-slider label="top-k" [min]="1" [max]="8" [(value)]="k" />
      <app-slider label="top-p" [min]="0.3" [max]="1" [step]="0.05" [(value)]="p" [format]="fix2" />
      <div style="margin-top:12px">
        @for (c of cands; track c[0]) {
          @let kept = keep()[$index];
          <div class="bar">
            <span
              [style.color]="kept ? null : 'var(--muted)'"
              [style.text-decoration]="kept ? null : 'line-through'"
              >{{ c[0] }}</span
            >
            <div class="t">
              <i
                [class.off]="!kept"
                [style.width.%]="(kept ? kept / total() : base[$index]) * 100"
              ></i>
            </div>
            <span>{{ kept ? ((kept / total()) * 100).toFixed(1) + '%' : 'cut' }}</span>
          </div>
        }
      </div>
      <div class="row" style="margin-top:12px">
        <button class="btn on" (click)="sample()">Sample 10 tokens</button>
      </div>
      <div class="row" style="margin-top:10px">
        @for (w of samples(); track $index) {
          <span class="chip">{{ w }}</span>
        }
      </div>
    </div>
  `,
})
export class SamplingWidget {
  protected readonly cands = CANDS;
  protected readonly fix2 = fix2;
  protected readonly base = softmax(CANDS.map((c) => c[1]));
  protected readonly k = signal(8);
  protected readonly p = signal(1);
  protected readonly samples = signal<string[]>([]);
  /** Renormalisation happens in the template via total(). */
  protected readonly keep = computed(() => {
    let cum = 0;
    return this.base.map((v, i) => {
      const ok = i < this.k() && cum < this.p() - 1e-9;
      cum += v;
      return ok ? v : 0;
    });
  });
  protected readonly total = computed(() => this.keep().reduce((a, b) => a + b, 0));
  protected sample() {
    const k = this.keep(),
      s = this.total(),
      out: string[] = [];
    for (let n = 0; n < 10; n++) {
      let r = Math.random() * s,
        i = 0;
      while (i < k.length - 1 && r > k[i]) r -= k[i++];
      out.push(CANDS[i][0]);
    }
    this.samples.set(out);
  }
}

const KV_CTX = [1024, 4096, 8192, 32768, 131072, 200000, 1000000];

@Component({
  selector: 'w-kv-cache',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Slider],
  host: { class: 'contents' },
  template: `
    <div class="panel">
      <app-slider label="layers" [min]="8" [max]="96" [step]="4" [(value)]="L" />
      <app-slider label="KV heads" [min]="1" [max]="64" [(value)]="h" />
      <app-slider label="head dim" [min]="64" [max]="256" [step]="64" [(value)]="dh" />
      <app-slider label="context tokens" [min]="0" [max]="6" [(value)]="ni" [format]="fmtCtx" />
      <div class="stat" style="margin-top:12px">
        <div>
          <b>{{ fmt(perToken()) }}</b
          ><span>per token</span>
        </div>
        <div>
          <b>{{ fmt(perToken() * ctx()) }}</b
          ><span>whole context, bf16, batch 1</span>
        </div>
      </div>
      <p class="cap" style="margin-top:10px">
        size = 2 (K and V) × layers × kv_heads × head_dim × tokens × 2 bytes. Defaults match a
        typical 8B model with GQA.
      </p>
    </div>
  `,
})
export class KvCacheWidget {
  protected readonly L = signal(32);
  protected readonly h = signal(8);
  protected readonly dh = signal(128);
  protected readonly ni = signal(2);
  protected readonly fmt = bytes;
  protected readonly fmtCtx = (v: number) => KV_CTX[v].toLocaleString();
  protected readonly ctx = computed(() => KV_CTX[this.ni()]);
  protected readonly perToken = computed(() => 2 * this.L() * this.h() * this.dh() * 2);
}
