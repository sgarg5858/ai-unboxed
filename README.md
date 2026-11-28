# AI, Unboxed

An interactive guide to how modern AI works, one layer at a time. It starts with the whole assistant system (auth, guardrails, memory, tools, search, safety training), then opens the LLM inside it, from tokens and attention to training, then covers RAG, tools and MCP, agents, evals, AI security and AI-assisted engineering (those last sections are coming soon). Built with Angular. The content lives in JSON, so a new topic is just a new chapter file.

| Section                    | Chapter                                               | Covers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 01 Roadmap                 | Course roadmap                                        | the checklist of 120 topics the course aims to cover, in six areas (LLM concepts, RAG, AI system design, AI agents, evals, AI security); covered topics link to their slide, the rest say coming soon. Edit `src/content/roadmap.json` to tick one off                                                                                                                                                                                                                                                                                                                                                                                                   |
| 02 Assistant architecture  | Assistant architecture                                | the whole system on one diagram: auth, guardrails, conversation management, memory, tools and MCP, web search and retrieval, prompt-injection defenses, safety training, human feedback, monitoring                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| 03 LLM architecture        | 3.1 How an LLM runs                                   | the forward pass end to end, generation loop, inside a GPU (memory, link, compute cores, on-chip memory, how weights stream in tiles, why they can't stay on the chip), prefill and decode step by step (dimension, matrix shapes, compute- vs memory-bound), batching and the KV cache (cache size, one row per person, own-cache attention, PagedAttention, continuous batching, throughput vs latency), glossary                                                                                                                                                                                                                                      |
|                            | 3.2 Tokens                                            | why we need tokens, vocabulary and token IDs, how big a token should be, raw bytes, BPE, the strawberry problem, special tokens and chat templates, the context window, why tokens cost money                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
|                            | 3.3 Embeddings                                        | the meaning problem, the embedding table, choosing the width, what the geometry encodes, token vs sentence embeddings, cosine similarity and its limits, what embeddings are used for (recommendations, RAG, clustering), why word order needs position, token + position embeddings, the input matrix, RoPE (turning vectors by position, with a worked example), bias, recap                                                                                                                                                                                                                                                                           |
|                            | 3.4 Transformer architecture                          | what GPT stands for, RNNs and LSTMs before transformers, "Attention Is All You Need"; why attention is needed ("it" and "bank" take meaning from context); the generation loop: predict one token, append it, run again, and how a reply ends; one run of the transformer from text to the next token; the whole transformer in one picture; layer normalization and where it sits; multi-head causal self-attention at a glance, heads in parallel; the feed-forward layer; residual (skip) connections; one layer animated (attention scores, softmax weights, heads, MLP); linear & softmax: from the last token's vector to next-token probabilities |
|                            | 3.5 Attention                                         | query, key and value as a question, a name tag and a backpack; the causal mask; multi-head; cost; the KV cache in every layer; position in depth (sinusoidal waves)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
|                            | 3.6 The MLP layer                                     | what the MLP does (each token on its own), expand into detectors, the bend (ReLU, GELU, SiLU), shrink and add, SwiGLU's gate, what it stores (key–value memory, facts), where the parameters are                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
|                            | 3.7 Parameters, depth and experts                     | residual stream, norms, MLP, parameter counts, MoE                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|                            | 3.8 End to end: one sentence                          | “I went to bank to deposit” through every stage with real numbers: tokens and GPT-2 IDs, embeddings + position, attention (“deposit” looks back at “bank”), feed-forward and residual adds, scores and softmax (“money” wins); an interactive step-through of a tiny model                                                                                                                                                                                                                                                                                                                                                                               |
|                            | 3.9 Output & inference                                | logits, temperature, top-k/top-p, KV cache, context window                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
|                            | 3.10 Training                                         | parameters as knobs, self-supervised data, forward pass, loss, backprop, gradient descent, batches and epochs, overfitting, training vs inference, GPUs and sharing, frontier-scale training, post-training                                                                                                                                                                                                                                                                                                                                                                                                                                              |
|                            | 3.11 Reasoning models                                 | thinking before answering, why extra tokens help (test-time compute), how RL on checkable problems teaches it, thinking budgets, when to use them and their limits                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
|                            | 3.12 Why LLMs hallucinate                             | what a hallucination is, four causes (training objective, rare facts, scoring that rewards guessing, error snowballing), Anthropic's "don't know" circuit, detection with semantic entropy, and defences                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 04 RAG                     | 4.1 Retrieval-augmented generation                    | why models need to look things up, the two phases (indexing and answering), chunking, embedding models, vector databases and ANN search, hybrid search (BM25 + vectors, RRF), reranking, building the prompt, query rewriting and agentic RAG, testing (recall@k, faithfulness), security, RAG vs long context vs fine-tuning                                                                                                                                                                                                                                                                                                                            |
| 05 Tools & MCP             | 5.1 Tool calling _(coming soon)_                      | tool definitions, how a model decides to call a tool, the request → run → result round trip, parallel calls, good descriptions, errors and safety                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
|                            | 5.2 MCP _(coming soon)_                               | why a standard, hosts, clients and servers, tools, resources and prompts, local and remote servers, auth and security, building a server                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| 06 AI agents               | 6.1 AI agents _(coming soon)_                         | the agent loop, workflows vs agents, planning, memory, multi-agent systems, computer use                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
|                            | 6.2 Context engineering _(coming soon)_               | context rot, just-in-time retrieval, compaction, sub-agents, memory files, short tool results                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 07 Evals                   | 7.1 Evals _(coming soon)_                             | test sets from real cases, code graders, LLM-as-judge and human review, agent evals, benchmarks and their limits, evals in CI                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| 08 AI security             | 8.1 AI security _(coming soon)_                       | prompt injection, jailbreaks, data leaks through tools, the “lethal trifecta”, sandboxes and permissions, red-teaming                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| 09 AI-assisted engineering | 9.1 Skills: from idea to shipped code _(coming soon)_ | vibe coding vs engineering with an agent, what a skill is (SKILL.md, progressive disclosure, the Agent Skills open standard), the main flow (align, spec, tickets, build, review), grilling and specs, vertical-slice tickets and fresh context (context rot), TDD, debugging and prototypes, two-axis review, any-time skills, writing your own skill (Anthropic's best practices), further reading                                                                                                                                                                                                                                                     |
|                            | 9.2 Agent-ready codebases _(coming soon)_             | CLAUDE.md and AGENTS.md, fast tests, types and linters as guardrails, findable docs, one-command setup, CI checks                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |

Chapters are grouped into **sections**, shown as tabs under the header. On wide screens a sidebar lists the current section's chapters, each with a › to expand its slides; tick a slide's circle to mark it done (saved in your browser). The panel button at the top of the sidebar hides or shows it; on smaller screens the same panel button, at the top left, opens every section as a drawer, and the theme control shrinks to one button that steps through Auto, Light, Dark and Glass. **Sections still being written show a pulsing dot on their tab and “soon” in the sidebar. **Search** (the box in the header, or press `/` or Ctrl/⌘+K) jumps to any slide in the course. Keyboard users get skip links (first Tab), arrow keys between slides, `[` to hide the sidebar and `?` for the full shortcut list; focus moves to the new slide's heading after a jump, and each move is announced to screen readers.

## Running it

Requires Node `^20.19`, `^22.12` or `>=24`.

```bash
npm install
npm start          # dev server at http://localhost:4200
npm test           # validates all content and renders every slide
npm run build      # static site in dist/ai-unboxed/browser
```

Live site: **https://sgarg5858.github.io/ai-unboxed/**

### Deployment

Every push to `main` runs [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml): it installs dependencies, runs the tests, builds with the base path set from the repo name (`/ai-unboxed/`) and publishes to GitHub Pages. If any test fails, nothing is deployed. You can also start it by hand from the repo's Actions tab ("Run workflow").

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

URLs use the hash, as in `#/attention/3` (chapter id, then a 1-based slide number; sections don't appear in the URL), so the build runs on any static host (GitHub Pages, Netlify, S3) with no rewrite rules. Old `#assistant` links still work.

The first page is the assistant architecture diagram. When one slide mentions another chapter, it uses the chapter's name rather than its number, so chapters can be reordered freely.

## How it's organised

See [ARCHITECTURE.md](ARCHITECTURE.md) for the design and [CLAUDE.md](CLAUDE.md) for coding conventions.

```
src/
  content/
    course.ts                 chapter manifest: id, name and an on-demand loader per chapter
    chapters/*.json           all slide text, code samples and layout
    schema/chapter.schema.json  editor autocomplete and validation for the JSON
  app/
    course/                   content types, URL-driven navigation, page shell
    blocks/                   generic, config-driven building blocks (stages, tabs, stepper…)
    widgets/                  named interactive widgets that need real logic
      registry.ts             widget name → lazy loader
    shared/                   slide figure, slider, matrix table, code block, math and formatting helpers
  styles.css                  design tokens (light/dark), reset, shared primitives (.panel, .btn, .stage …)
```

The rule of thumb: **content and layout go in JSON, behaviour goes in code.** Most slides need only generic blocks. A widget is for an interaction that computes something, such as a temperature slider or the attention matrices.

## Styling

- **Global** (`src/styles.css`): tokens, reset, shared primitives used across many widgets, and rules for HTML that Angular can't scope, such as slide text injected with `[innerHTML]` (`<code>`, `.k`) and the syntax-highlighted code spans.
- **Component** (a `.css` file next to the component): anything only that component uses, for example the page layout and navigation in `course-shell.css`. Scoped styles can't leak into other components or be hit by a same-named class elsewhere.
- Rule of thumb: if two or more components need the same class, make it a global primitive. If one does, keep it in the component.

## Adding or editing content

Open a file in `src/content/chapters/`. VS Code reads the `$schema` line, so you get autocomplete and red squiggles as you type.

A slide looks like this:

```json
{
  "title": "Softmax and temperature",
  "summary": "One-sentence takeaway shown under the title.",
  "body": [
    "A paragraph. Inline <b>HTML</b> and <code>code</code> are fine.",
    { "ul": ["A bullet", "Another bullet"] },
    { "h": "A small subheading" },
    { "note": "A callout box.", "kind": "key" }
  ],
  "code": ["probs = (logits / T).softmax(-1)", "next_id = probs.argmax()"],
  "viz": [
    { "type": "widget", "name": "temperature" },
    { "type": "caption", "html": "Small print under the panel." }
  ]
}
```

- **Callouts:** `kind` is `key` (Key idea), `analogy`, `dev` (For developers), `warn` (Watch out) or `example` (Worked example).
- **Writing style:** open with the intuition, then the mechanism, then numbers and practice. Define every term in bold where it first appears, keep paragraphs to two or three sentences, and give every slide a `summary`.
- **New slide:** add an object to a chapter's `slides` array.
- **New chapter:** copy a chapter file, give it a new `id` and `name`, and add an entry with the same id, name and a loader to a section in `src/content/course.ts`. Chapters are loaded on demand, so the site stays fast as the course grows.
- **New topic** (for example RAG or Agents): add a section in `src/content/course.ts` with its chapters. It appears as a new heading in the sidebar outline.
- Inline `style="…"` attributes in HTML strings are stripped by Angular's sanitizer. Use classes such as `mono`, `cap` or `k` instead.

### Generic blocks for `viz`

Top-level blocks each get their own panel. Blocks inside a `panel`, `tabs` or `stepper` render inside it.

| type      | What it shows                                                      | Key fields                                                                                                 |
| --------- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| `caption` | small muted text                                                   | `html`                                                                                                     |
| `text`    | a normal-size paragraph (for example inside a collapsible `panel`) | `html`                                                                                                     |
| `stages`  | vertical list of labelled rows (pipelines, layers, message logs)   | `items[]`: `label`, `sub`, `value`, `tone`, `highlight`, `dim`, `strike`, `mono`, `spacer`, `goto`         |
| `chips`   | a row of token chips                                               | `items[]`: `text`, `sub`, `hot`, `dim`                                                                     |
| `bars`    | horizontal bars                                                    | `items[]`: `label`, `value` (0–1), `display`; `layout`: `inline` or `stacked`                              |
| `table`   | small labelled table                                               | `rows[]`: `head`, `cells[]`: `text`, `tone`                                                                |
| `stat`    | big-number tiles                                                   | `items[]`: `value`, `label`                                                                                |
| `code`    | code block                                                         | `source[]` (lines), `title`                                                                                |
| `shape`   | highlighted monospace tag                                          | `text`                                                                                                     |
| `panel`   | group several blocks in one panel                                  | `blocks[]`                                                                                                 |
| `tabs`    | buttons that switch between views                                  | `tabs[]`: `label`, `blocks[]`                                                                              |
| `stepper` | click-through sequence                                             | `steps[]`: `blocks[]` or `item`, plus `caption`; `accumulate: true` grows a `stages` list one row per step |
| `widget`  | a named interactive component                                      | `name`, `props`                                                                                            |

`goto` on a stage row (`{ "chapter": "attention", "slide": 2 }`) makes the row a link.

### Adding a widget

1. Write a standalone component in `src/app/widgets/`. Give it `host: { class: 'contents' }` and output a `.panel`, optionally followed by a `.cap`. If it takes data from JSON, declare `readonly props = input.required<YourProps>()`.
2. Register it in `src/app/widgets/registry.ts`.
3. Add its name to the `widget` enum in `src/content/schema/chapter.schema.json`. A test fails if the schema and registry drift apart.

## Tests

`npm test` runs Vitest:

- every chapter JSON validates against the schema
- every widget name and `goto` link resolves
- every slide in the course renders without errors
- navigation and URL parsing, and the code highlighter
