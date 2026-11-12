import { ChangeDetectionStrategy, Component, computed, linkedSignal, signal } from '@angular/core';
import { Slider } from '../shared/slider/slider';
import { bm25, chunkWords, covers, rankOf, rrf } from '../shared/lib/retrieval';

const DOC =
  'Returns policy. Most items can be returned within 30 days of delivery with a receipt. ' +
  'Refunds go back to the original payment method within five working days. ' +
  'Laptops and tablets are different. They can be returned within 14 days, and only if the seal is unbroken. ' +
  'Opened laptops can be exchanged for the same model but not refunded. ' +
  'Gift cards cannot be returned. Sale items can be returned for store credit only. ' +
  'Shipping costs are not refunded unless the item arrived damaged. ' +
  'To start a return, sign in, choose Orders, then Return an item.';
const WORDS = DOC.split(' ');
/** The answer to "Can I get a refund on a laptop I've opened?" spans these three sentences. */
const ANS_START = WORDS.indexOf('Laptops');
const ANS_END = WORDS.indexOf('refunded.') + 1;

/** Chunk a short policy document and see whether one chunk holds the whole answer. */
@Component({
  selector: 'w-chunk-size',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Slider],
  host: { class: 'contents' },
  styles: `
    .list {
      display: grid;
      gap: 6px;
      margin: 12px 0;
      max-height: 340px;
      overflow: auto;
    }
    .chunk {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 6px 10px;
      font-size: 13px;
      line-height: 1.5;
      background: var(--sunk);
    }
    .chunk.best {
      border-color: var(--accent);
      background: var(--accent-soft);
    }
    .chunk small {
      display: block;
      color: var(--muted);
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
    }
    .ans {
      color: var(--heat-ink);
      font-weight: 600;
    }
    .verdict {
      margin: 0;
      padding: 8px 12px;
      border-radius: 8px;
      border-left: 4px solid var(--neg);
    }
    .verdict.good {
      border-color: var(--pos);
    }
  `,
  template: `
    @let r = result();
    <div class="panel">
      <p class="cap" style="margin:0 0 8px">
        Question: <b>“Can I get a refund on a laptop I've opened?”</b> The words that answer it are
        in <span class="ans">orange</span>.
      </p>
      <app-slider label="chunk size" [min]="8" [max]="90" [(value)]="size" [format]="wordsFmt" />
      <app-slider
        label="overlap"
        [min]="0"
        [max]="maxOverlap()"
        [(value)]="overlap"
        [format]="wordsFmt"
      />
      <div class="list" role="list" aria-label="Chunks">
        @for (c of r.chunks; track c.start) {
          <div class="chunk" role="listitem" [class.best]="$index === r.best">
            <small
              >CHUNK {{ $index + 1 }} · {{ c.end - c.start }} words
              @if ($index === r.best) {
                · {{ r.complete ? '✓ whole answer' : 'best match, answer cut off' }}
              }
            </small>
            @for (w of c.words; track $index) {
              <span [class.ans]="w.ans">{{ w.text }} </span>
            }
          </div>
        }
      </div>
      <div class="stat">
        <div>
          <b>{{ r.chunks.length }}</b
          ><span>chunks to embed and store</span>
        </div>
        <div>
          <b>{{ r.focus }}%</b><span>of the best chunk is the answer</span>
        </div>
      </div>
      <p class="verdict" style="margin-top:12px" [class.good]="r.good">
        <b>{{ r.verdict }}</b> {{ r.why }}
      </p>
    </div>
    <p class="cap">
      Sizes are in words to keep it simple; real systems count tokens. Note how “They” in the answer
      means laptops only if the previous sentence is in the same chunk.
    </p>
  `,
})
export class ChunkSizeWidget {
  protected readonly size = signal(20);
  protected readonly maxOverlap = computed(() => Math.floor(this.size() / 2));
  protected readonly overlap = linkedSignal<number, number>({
    source: this.maxOverlap,
    computation: (max, prev) => Math.min(prev?.value ?? 0, max),
  });
  protected readonly wordsFmt = (v: number) => v + ' words';

  protected readonly result = computed(() => {
    const chunks = chunkWords(WORDS.length, this.size(), this.overlap()).map((c) => ({
      ...c,
      hits: Math.max(0, Math.min(c.end, ANS_END) - Math.max(c.start, ANS_START)),
      words: WORDS.slice(c.start, c.end).map((text, i) => ({
        text,
        ans: c.start + i >= ANS_START && c.start + i < ANS_END,
      })),
    }));
    // The retriever's best pick: the chunk with the most answer words, then the most focused.
    const best = chunks.reduce(
      (bi, c, i) =>
        c.hits > chunks[bi].hits ||
        (c.hits === chunks[bi].hits && c.end - c.start < chunks[bi].end - chunks[bi].start)
          ? i
          : bi,
      0,
    );
    const b = chunks[best];
    const complete = covers(b, ANS_START, ANS_END);
    const focus = Math.round((b.hits / (b.end - b.start)) * 100);
    if (!complete)
      return {
        chunks,
        best,
        complete,
        focus,
        good: false,
        verdict: 'Too small.',
        why: 'No chunk holds the whole answer, so the model sees only part of it. Try a bigger size, or add overlap.',
      };
    if (focus < 45)
      return {
        chunks,
        best,
        complete,
        focus,
        good: false,
        verdict: 'Too big.',
        why: 'The answer is in there, but mixed with unrelated rules. Its embedding gets blurred, and every retrieval spends tokens on text that does not help.',
      };
    return {
      chunks,
      best,
      complete,
      focus,
      good: true,
      verdict: 'About right.',
      why: 'One chunk holds the whole answer, with little else around it.',
    };
  });
}

type Method = 'keyword' | 'vector' | 'hybrid';
const CHUNKS = [
  'Error E-4012 means the battery is not charging. Replace the charger first.',
  'If the display is damaged or cracked, book a screen repair. Repairs are free under warranty.',
  'To reset your password, choose Forgot password on the sign-in page.',
  'Battery life drops in cold weather. Keep the laptop above 10°C.',
  'The warranty covers manufacturing faults for two years. Accidental damage, such as a dropped laptop, is not covered.',
  'Error codes starting with E-40 relate to power. See the error list for each code.',
];
type Query = { text: string; relevant: number[]; vector: number[]; lesson: string };
/** Vector scores are illustrative cosine similarities; keyword scores are computed live with BM25. */
const QUERIES: Query[] = [
  {
    text: 'What does E-4012 mean?',
    relevant: [0],
    vector: [0.55, 0.12, 0.1, 0.6, 0.15, 0.68],
    lesson:
      'An exact code. Keyword search finds the one chunk that contains “E-4012”. To an embedding, E-4012 looks like any other error or battery problem, so vector search ranks two near-misses first.',
  },
  {
    text: 'I dropped my laptop and the glass broke. Can it be fixed?',
    relevant: [1, 4],
    vector: [0.18, 0.74, 0.09, 0.27, 0.58, 0.14],
    lesson:
      'Same meaning, different words. The repair chunk says “display”, “cracked” and “repair”, sharing no words with the question, so keyword search misses it. Vector search matches the meaning and finds both. Hybrid finds one: fusion can’t fully fix a list that is confidently wrong. A reranker, next slide, can.',
  },
  {
    text: 'Does the guarantee pay for E-4012?',
    relevant: [0, 4],
    vector: [0.52, 0.41, 0.08, 0.31, 0.71, 0.56],
    lesson:
      'Needs both: the exact code, and the idea that “guarantee” means warranty. Each method alone finds one needed chunk; hybrid ranks both in the top 2.',
  },
];

/** Compare keyword (BM25), vector and hybrid (RRF) ranking on a tiny help-centre index. */
@Component({
  selector: 'w-hybrid-search',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'contents' },
  styles: `
    ol {
      list-style: none;
      margin: 12px 0 0;
      padding: 0;
      display: grid;
      gap: 6px;
    }
    li {
      display: grid;
      grid-template-columns: 22px 1fr auto;
      gap: 8px;
      align-items: start;
      padding: 7px 10px;
      border-radius: 8px;
      border: 1px solid var(--line);
      font-size: 13px;
      line-height: 1.45;
    }
    li.top {
      background: var(--sunk);
    }
    li.cut {
      opacity: 0.5;
    }
    li.rel {
      border-color: var(--pos);
    }
    .n {
      font-weight: 700;
      color: var(--muted);
    }
    .s {
      font-size: 12px;
      color: var(--muted);
      text-align: right;
    }
    .tag {
      color: var(--pos-ink);
      font-weight: 700;
    }
    .div {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      color: var(--muted);
      margin: 2px 0;
    }
  `,
  template: `
    @let r = result();
    <div class="panel">
      <p class="cap" style="margin:0 0 6px">Question</p>
      <div class="row" style="margin-bottom:10px">
        @for (q of queries; track q.text) {
          <button class="btn" [class.on]="query() === q" (click)="query.set(q)">
            {{ q.text }}
          </button>
        }
      </div>
      <p class="cap" style="margin:0 0 6px">Search with</p>
      <div class="row" role="tablist" aria-label="Search method">
        @for (m of methods; track m.id) {
          <button
            class="btn"
            role="tab"
            [attr.aria-selected]="method() === m.id"
            [class.on]="method() === m.id"
            (click)="method.set(m.id)"
          >
            {{ m.label }}
          </button>
        }
      </div>
      <ol aria-label="Ranked results">
        @for (it of r.items; track it.i) {
          @if ($index === k) {
            <div class="div">BELOW THE CUT: NOT SENT TO THE MODEL</div>
          }
          <li [class.top]="$index < k" [class.cut]="$index >= k" [class.rel]="it.rel">
            <span class="n">{{ $index + 1 }}</span>
            <span
              >{{ it.text }}
              @if (it.rel) {
                <span class="tag"> ✓ needed</span>
              }
            </span>
            <span class="s mono">{{ it.score }}</span>
          </li>
        }
      </ol>
      <div class="stat" style="margin-top:12px">
        <div>
          <b>{{ r.found }} of {{ r.need }}</b
          ><span>needed chunks in the top {{ k }}</span>
        </div>
      </div>
      <p class="cap" style="margin-top:10px">{{ query().lesson }}</p>
    </div>
    <p class="cap">
      Keyword scores are real BM25 on these six chunks. Vector scores are illustrative. Hybrid uses
      reciprocal rank fusion: each list adds 1 / (60 + rank).
    </p>
  `,
})
export class HybridSearchWidget {
  protected readonly k = 2;
  protected readonly queries = QUERIES;
  protected readonly methods: { id: Method; label: string }[] = [
    { id: 'keyword', label: 'Keyword (BM25)' },
    { id: 'vector', label: 'Vector' },
    { id: 'hybrid', label: 'Hybrid' },
  ];
  protected readonly query = signal(QUERIES[0]);
  protected readonly method = signal<Method>('keyword');

  protected readonly result = computed(() => {
    const q = this.query();
    const kw = bm25(q.text, CHUNKS);
    const lists = {
      keyword: kw,
      vector: q.vector,
      hybrid: rrf([rankOf(kw), rankOf(q.vector)], CHUNKS.length),
    };
    const scores = lists[this.method()];
    const digits = this.method() === 'hybrid' ? 4 : 2;
    const items = rankOf(scores).map((i) => ({
      i,
      text: CHUNKS[i],
      rel: q.relevant.includes(i),
      score: scores[i].toFixed(digits),
    }));
    const found = items.slice(0, this.k).filter((it) => it.rel).length;
    return { items, found, need: q.relevant.length };
  });
}
