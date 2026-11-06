/**
 * The course manifest, in reading order and grouped into sections. Each chapter's content lives
 * in ./chapters and is loaded only when a reader opens it (see course/chapter-store.ts).
 *
 * To add a chapter: create a JSON file in ./chapters (copy an existing one; the $schema line gives
 * you autocomplete) and add an entry below with the same id and name as the file.
 * course.spec.ts checks that every entry matches its JSON. To add a topic such as RAG or Agents,
 * add a new section. Slides refer to other chapters by id, not number, so reordering is safe.
 */
import type { ChapterContent, ChapterRef, SectionContent } from '../app/course/content.model';

// JSON imports are typed structurally with widened strings, so they're cast here.
const json = (file: Promise<{ default: unknown }>) => file.then((m) => m.default as ChapterContent);

export const SECTIONS: readonly SectionContent[] = [
  {
    id: 'assistant',
    name: 'Assistant architecture',
    chapters: [
      {
        id: 'assistant',
        name: 'Assistant architecture',
        load: () => json(import('./chapters/01-assistant-architecture.json')),
      },
    ],
  },
  {
    id: 'llm',
    name: 'LLM architecture',
    chapters: [
      {
        id: 'map',
        name: 'The big picture',
        load: () => json(import('./chapters/02-big-picture.json')),
      },
      {
        id: 'input',
        name: 'Tokens & embeddings',
        load: () => json(import('./chapters/03-tokens-embeddings.json')),
      },
      {
        id: 'attention',
        name: 'Attention',
        load: () => json(import('./chapters/04-attention.json')),
      },
      {
        id: 'block',
        name: 'The transformer block',
        load: () => json(import('./chapters/05-transformer-block.json')),
      },
      {
        id: 'output',
        name: 'Output & inference',
        load: () => json(import('./chapters/06-output-inference.json')),
      },
      {
        id: 'training',
        name: 'Training',
        load: () => json(import('./chapters/07-training.json')),
      },
      {
        id: 'reasoning',
        name: 'Reasoning models',
        load: () => json(import('./chapters/08-reasoning-models.json')),
      },
      {
        id: 'hallucination',
        name: 'Why LLMs hallucinate',
        load: () => json(import('./chapters/09-why-llms-hallucinate.json')),
      },
    ],
  },
];

/** Every chapter in reading order. URLs and navigation use this flat list. */
export const CHAPTERS: readonly ChapterRef[] = SECTIONS.flatMap((s) => s.chapters);
