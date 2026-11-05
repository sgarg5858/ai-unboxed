/**
 * The course, in reading order, grouped into sections. To add a chapter: create a JSON file in
 * ./chapters (copy an existing one; the $schema line gives you autocomplete), import it here and
 * put it in a section. To add a topic such as RAG or Agents, add a new section.
 * Slides refer to other chapters by name, not number, so reordering is safe.
 */
import type { ChapterContent, SectionContent } from '../app/course/content.model';
import assistant from './chapters/01-assistant-architecture.json';
import bigPicture from './chapters/02-big-picture.json';
import tokens from './chapters/03-tokens-embeddings.json';
import attention from './chapters/04-attention.json';
import block from './chapters/05-transformer-block.json';
import output from './chapters/06-output-inference.json';
import training from './chapters/07-training.json';
import hallucination from './chapters/08-why-llms-hallucinate.json';

// JSON imports are typed structurally with widened strings, so they're cast here.
// course.spec.ts validates every block and widget name at test time.
const chapter = (c: unknown) => c as ChapterContent;

export const SECTIONS: readonly SectionContent[] = [
  { id: 'assistant', name: 'Assistant architecture', chapters: [chapter(assistant)] },
  {
    id: 'llm',
    name: 'LLM architecture',
    chapters: [bigPicture, tokens, attention, block, output, training, hallucination].map(chapter),
  },
];

/** Every chapter in reading order. URLs and navigation use this flat list. */
export const COURSE: readonly ChapterContent[] = SECTIONS.flatMap((s) => s.chapters);
