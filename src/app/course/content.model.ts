/**
 * Shape of the course content in src/content/chapters/*.json.
 * Keep in sync with src/content/schema/chapter.schema.json (editor validation)
 * and the block renderer in src/app/blocks.
 */

export type NoteKind = 'key' | 'analogy' | 'dev' | 'warn' | 'example';

/**
 * One piece of slide prose:
 * - a string is a paragraph (inline HTML allowed: b, i, code)
 * - { ul } is a bullet list
 * - { h } is a small subheading
 * - { note, kind } is a callout box (Key idea, Analogy, For developers, Watch out, Worked example)
 * - { more, text, goto?, link? } is a collapsed accordion: `more` is the label, `text` (one paragraph or a list) shows when
 *   expanded, and an optional `goto` adds a `link` button to a slide that covers it in full
 */
export type Prose =
  | string
  | { ul: string[] }
  | { h: string }
  | { note: string; kind: NoteKind }
  | { more: string; text: string | string[]; goto?: Goto; link?: string };

export type Tone = 'pos' | 'neg' | 'muted' | 'accent' | 'heat';

export interface Goto {
  chapter: string;
  /** 1-based slide number. Defaults to 1. */
  slide?: number;
}

export interface StageItem {
  /** Main text. Inline HTML allowed. */
  label: string;
  /** Muted second line. Inline HTML allowed. */
  sub?: string;
  /** Right-hand monospace value. */
  value?: string;
  tone?: Tone;
  highlight?: boolean;
  dim?: boolean;
  strike?: boolean;
  /** Render the label in monospace (code, tool calls). */
  mono?: boolean;
  /** Small "⋮" style spacer row with no box. */
  spacer?: boolean;
  /** Makes the row a link to another slide. */
  goto?: Goto;
}

export interface ChipItem {
  text: string;
  sub?: string;
  hot?: boolean;
  dim?: boolean;
}

export interface BarItem {
  label: string;
  /** Fill fraction, 0–1. */
  value: number;
  display?: string;
}

export interface TableRow {
  head: string;
  cells: { text: string; tone?: 'accent' | 'heat' }[];
}

export type Block =
  | { type: 'caption'; html: string }
  /** A paragraph of normal-size text, e.g. inside a collapsible panel. */
  | { type: 'text'; html: string }
  | { type: 'stages'; items: StageItem[] }
  | { type: 'chips'; items: ChipItem[] }
  | { type: 'bars'; items: BarItem[]; layout?: 'inline' | 'stacked' }
  | { type: 'table'; rows: TableRow[] }
  | { type: 'stat'; items: { value: string; label: string }[] }
  | { type: 'code'; source: string[]; title?: string }
  | { type: 'shape'; text: string }
  /** tone 'neg' draws the panel as a red warning box. */
  /** A `title` makes the panel collapsible (closed until clicked, unless `open`). */
  | { type: 'panel'; blocks: Block[]; tone?: 'neg'; title?: string; open?: boolean }
  | { type: 'tabs'; tabs: { label: string; blocks: Block[] }[]; selected?: number }
  | {
      type: 'stepper';
      /** accumulate: show items[0..i] as a growing list. Otherwise show steps[i].blocks. */
      accumulate?: boolean;
      steps: { item?: StageItem; blocks?: Block[]; caption?: string }[];
      nextLabel?: string;
      restartLabel?: string;
    }
  | { type: 'widget'; name: string; props?: Record<string, unknown> }
  /** An external https tool, loaded in a sandboxed frame only when the reader clicks. */
  | { type: 'embed'; src: string; title: string; description?: string; height?: number };

export type BlockType = Block['type'];

/** A wide image shown under the slide's two columns. Paths are relative to public/. */
export interface Figure {
  src: string;
  /** Version for the dark theme. Defaults to src. */
  darkSrc?: string;
  /** Describes what the image shows, for screen readers. */
  alt: string;
  width: number;
  height: number;
  /** Inline HTML allowed. */
  caption?: string;
  /** "top" shows it under the title, before the text; default is under both columns. */
  placement?: 'top' | 'bottom';
  /** CSS-animated SVG: embedded live, with a Play/Pause button. */
  animated?: boolean;
}

export interface SlideContent {
  title: string;
  /** One-sentence takeaway shown under the title. */
  summary?: string;
  body: Prose[];
  /** Code sample shown under the prose, one string per line. */
  code?: string[];
  viz?: Block[];
  /** One wide image, or several shown one after another, under both columns. */
  figure?: Figure | Figure[];
}

/** A chapter in the course manifest: enough to build navigation, with its content loaded on demand. */
export interface ChapterRef {
  id: string;
  name: string;
  load: () => Promise<ChapterContent>;
  /** A placeholder chapter: marked "soon" in the tabs and outline, left out of progress counts. */
  soon?: boolean;
}

/** A top-level group of chapters, shown as a heading in the outline. */
export interface SectionContent {
  id: string;
  name: string;
  chapters: ChapterRef[];
}

/**
 * One of a chapter's videos, shown in Watch mode. Files live in src/content/videos/.
 * A video covers a range of slides; `at` gives where each slide's topic starts in it.
 */
export interface ChapterVideo {
  /** e.g. "videos/tokens.mp4", no leading slash (the base href varies). */
  src: string;
  title: string;
  /** Inline HTML allowed, as in prose. */
  description?: string;
  poster?: string;
  /** First and last slide it covers, 1-based and inclusive. Omitted: the whole chapter. */
  slides?: [number, number];
  /** Seconds into the video where a slide's topic starts, keyed by 1-based slide number. */
  at?: Record<string, number>;
  /** Timestamps: ticks on the seek bar and a clickable list under the player. */
  marks?: VideoMark[];
}

/** A named point in a video, e.g. { at: 85, label: "The context window" }. */
export interface VideoMark {
  at: number;
  label: string;
}

export interface ChapterContent {
  id: string;
  name: string;
  /** Up to a few videos, each covering a range of slides. */
  videos?: ChapterVideo[];
  slides: SlideContent[];
}
