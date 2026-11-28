/**
 * The course manifest, in reading order and grouped into sections. Each chapter's content lives
 * in ./chapters and is loaded only when a reader opens it (see course/chapter-store.ts).
 *
 * To add a chapter: create a JSON file in ./chapters (copy an existing one; the $schema line gives
 * you autocomplete) and add an entry below with the same id and name as the file.
 * course.spec.ts checks that every entry matches its JSON. To add a topic, add a new section. A chapter marked
 * `soon: true` is a placeholder: its tab and outline entry say so. Slides refer to other chapters by id, not number, so reordering is safe.
 */
import type { ChapterContent, ChapterRef, SectionContent } from '../app/course/content.model';

// JSON imports are typed structurally with widened strings, so they're cast here.
const json = (file: Promise<{ default: unknown }>) => file.then((m) => m.default as ChapterContent);

export const SECTIONS: readonly SectionContent[] = [
  {
    id: 'roadmap',
    name: 'Roadmap',
    chapters: [
      {
        id: 'roadmap',
        name: 'Course roadmap',
        load: () => json(import('./chapters/23-roadmap.json')),
      },
    ],
  },
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
        id: 'tokens',
        name: 'Tokens',
        load: () => json(import('./chapters/03-tokens.json')),
      },
      {
        id: 'embeddings',
        name: 'Embeddings',
        load: () => json(import('./chapters/04-embeddings.json')),
      },
      {
        id: 'transformer',
        name: 'Transformer architecture',
        load: () => json(import('./chapters/12-transformer-architecture.json')),
      },
      {
        id: 'attention',
        name: 'Attention',
        load: () => json(import('./chapters/05-attention.json')),
      },
      {
        id: 'mlp',
        name: 'The MLP layer',
        load: () => json(import('./chapters/22-mlp.json')),
      },
      {
        id: 'block',
        name: 'Parameters, depth and experts',
        load: () => json(import('./chapters/06-transformer-block.json')),
      },
      {
        id: 'output',
        name: 'Output & inference',
        load: () => json(import('./chapters/07-output-inference.json')),
      },
      {
        id: 'walkthrough',
        name: 'End to end: one sentence',
        load: () => json(import('./chapters/14-end-to-end.json')),
      },
      {
        id: 'map',
        name: 'How an LLM runs',
        load: () => json(import('./chapters/02-big-picture.json')),
      },
      {
        id: 'training',
        name: 'Training',
        load: () => json(import('./chapters/08-training.json')),
      },
      {
        id: 'reasoning',
        name: 'Reasoning models',
        load: () => json(import('./chapters/09-reasoning-models.json')),
      },
      {
        id: 'hallucination',
        name: 'Why LLMs hallucinate',
        load: () => json(import('./chapters/10-why-llms-hallucinate.json')),
      },
    ],
  },
  {
    id: 'rag',
    name: 'RAG',
    chapters: [
      {
        id: 'rag',
        name: 'Retrieval-augmented generation',
        load: () => json(import('./chapters/11-rag.json')),
      },
    ],
  },
  {
    id: 'tools',
    name: 'Tools & MCP',
    chapters: [
      {
        id: 'tool-calling',
        name: 'Tool calling: how models use tools',
        load: () => json(import('./chapters/21-tool-calling.json')),
        soon: true,
      },
      {
        id: 'mcp',
        name: 'MCP: connecting AI to tools and data',
        load: () => json(import('./chapters/15-mcp.json')),
        soon: true,
      },
    ],
  },
  {
    id: 'agents',
    name: 'AI agents',
    chapters: [
      {
        id: 'agents',
        name: 'AI agents: models that act',
        load: () => json(import('./chapters/16-agents.json')),
        soon: true,
      },
      {
        id: 'context',
        name: 'Context engineering',
        load: () => json(import('./chapters/17-context-engineering.json')),
        soon: true,
      },
    ],
  },
  {
    id: 'evals',
    name: 'Evals',
    chapters: [
      {
        id: 'evals',
        name: 'Evals: measuring AI quality',
        load: () => json(import('./chapters/18-evals.json')),
        soon: true,
      },
    ],
  },
  {
    id: 'security',
    name: 'AI security',
    chapters: [
      {
        id: 'security',
        name: 'AI security: attacks and defences',
        load: () => json(import('./chapters/19-ai-security.json')),
        soon: true,
      },
    ],
  },
  {
    id: 'engineering',
    name: 'AI-assisted engineering',
    chapters: [
      {
        id: 'skills',
        name: 'Skills: from idea to shipped code',
        load: () => json(import('./chapters/13-ai-skills.json')),
        soon: true,
      },
      {
        id: 'agent-ready',
        name: 'Agent-ready codebases',
        load: () => json(import('./chapters/20-agent-ready.json')),
        soon: true,
      },
    ],
  },
];

/**
 * Where a new reader lands (the bare URL, and unknown chapter ids). It isn't the first chapter:
 * the Roadmap comes first in the tabs, but the course itself starts here.
 */
export const START_CHAPTER = 'assistant';

/** Every chapter in reading order. URLs and navigation use this flat list. */
export const CHAPTERS: readonly ChapterRef[] = SECTIONS.flatMap((s) => s.chapters);
