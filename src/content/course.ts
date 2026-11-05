/**
 * The course, in reading order. To add a chapter: create a JSON file in ./chapters
 * (copy an existing one; the $schema line gives you autocomplete) and add it here.
 * Slides refer to other chapters by name, not number, so reordering is safe.
 */
import type { ChapterContent } from '../app/course/content.model';
import assistant from './chapters/01-assistant-architecture.json';
import bigPicture from './chapters/02-big-picture.json';
import tokens from './chapters/03-tokens-embeddings.json';
import attention from './chapters/04-attention.json';
import block from './chapters/05-transformer-block.json';
import output from './chapters/06-output-inference.json';
import training from './chapters/07-training.json';

// JSON imports are typed structurally with widened strings, so they're cast here.
// course.spec.ts validates every block and widget name at test time.
export const COURSE = [
  assistant,
  bigPicture,
  tokens,
  attention,
  block,
  output,
  training,
] as unknown as readonly ChapterContent[];
