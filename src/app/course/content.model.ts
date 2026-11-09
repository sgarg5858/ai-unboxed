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
 * - { more, text, goto?, link? } is a collapsed accordion: `more` is the label, `text` shows when
 *   expanded, and an optional `goto` adds a `link` button to a slide that covers it in full
 */
export type Prose =
  | string
  | { ul: string[] }
  | { h: string }
  | { note: string; kind: NoteKind }
  | { more: string; text: string; goto?: Goto; link?: string };

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
  | { type: 'stages'; items: StageItem[] }
  | { type: 'chips'; items: ChipItem[] }
  | { type: 'bars'; items: BarItem[]; layout?: 'inline' | 'stacked' }
  | { type: 'table'; rows: TableRow[] }
  | { type: 'stat'; items: { value: string; label: string }[] }
  | { type: 'code'; source: string[]; title?: string }
  | { type: 'shape'; text: string }
  | { type: 'panel'; blocks: Block[] }
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
}

/** A top-level group of chapters, shown as a heading in the outline. */
export interface SectionContent {
  id: string;
  name: string;
  chapters: ChapterRef[];
}

export interface ChapterContent {
  id: string;
  name: string;
  slides: SlideContent[];
}
