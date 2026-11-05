# AI, Unboxed

An interactive guide to how modern AI works, one layer at a time. It starts with the whole assistant system (auth, guardrails, memory, tools, search, safety training), then opens the LLM inside it, from tokens and attention to training. Built with Angular. The content lives in JSON, so a new topic is just a new chapter file.

| Section | Chapter | Covers |
|---------|---------|--------|
| 01 Assistant architecture | Assistant architecture | the whole system on one diagram: auth, guardrails, conversation management, memory, tools and MCP, web search and retrieval, prompt-injection defenses, safety training, human feedback, monitoring |
| 02 LLM architecture | 2.1 The big picture | the forward pass end to end, generation loop, vectors primer, glossary |
| | 2.2 Tokens & embeddings | BPE, embeddings, positional encoding, RoPE |
| | 2.3 Attention | Q/K/V, masking, multi-head, cost |
| | 2.4 The transformer block | residual stream, norms, MLP, parameter counts, MoE |
| | 2.5 Output & inference | logits, temperature, top-k/top-p, KV cache, context window |
| | 2.6 Training | next-token loss, backprop, training loop, SFT and preference tuning |

Chapters are grouped into **sections**. The top row of the page shows sections; a section with more than one chapter shows its chapters as a second row.

## Running it

Requires Node `^20.19`, `^22.12` or `>=24`.

```bash
npm install
npm start          # dev server at http://localhost:4200
npm test           # validates all content and renders every slide
npm run build      # static site in dist/inside-an-llm/browser
```

Live site: **https://sgarg5858.github.io/inside-an-llm/**

### Deployment

Every push to `main` runs [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml): it installs dependencies, runs the tests, builds with `npm run build:pages` (base path `/inside-an-llm/`) and publishes to GitHub Pages. If any test fails, nothing is deployed. You can also start it by hand from the repo's Actions tab ("Run workflow").

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

URLs use the hash, as in `#/attention/3` (chapter id, then a 1-based slide number; sections don't appear in the URL), so the build runs on any static host (GitHub Pages, Netlify, S3) with no rewrite rules. Old `#assistant` links still work.

The first page is the assistant architecture diagram. When one slide mentions another chapter, it uses the chapter's name rather than its number, so chapters can be reordered freely.

## How it's organised

```
src/
  content/
    course.ts                 chapter order: import a chapter JSON here to add it
    chapters/*.json           all slide text, code samples and layout
    schema/chapter.schema.json  editor autocomplete and validation for the JSON
  app/
    course/                   content types, URL-driven navigation, page shell
    blocks/                   generic, config-driven building blocks (stages, tabs, stepper…)
    widgets/                  named interactive widgets that need real logic
      registry.ts             widget name → component
    shared/                   slider, matrix table, code block, math and formatting helpers
  styles.css                  design tokens (light/dark) and shared classes
```

The rule of thumb: **content and layout go in JSON, behaviour goes in code.** Most slides need only generic blocks. A widget is for an interaction that computes something, such as a temperature slider or the attention matrices.

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
- **New chapter:** copy a chapter file, give it a new `id` and `name`, import it in `src/content/course.ts` and add it to a section there.
- **New topic** (for example RAG or Agents): add a section in `src/content/course.ts` with its chapters. It appears as a new top-level pill. A section with a single chapter shows no second row.
- Inline `style="…"` attributes in HTML strings are stripped by Angular's sanitizer. Use classes such as `mono`, `cap` or `k` instead.

### Generic blocks for `viz`

Top-level blocks each get their own panel. Blocks inside a `panel`, `tabs` or `stepper` render inside it.

| type | What it shows | Key fields |
|------|---------------|------------|
| `caption` | small muted text | `html` |
| `stages` | vertical list of labelled rows (pipelines, layers, message logs) | `items[]`: `label`, `sub`, `value`, `tone`, `highlight`, `dim`, `strike`, `mono`, `spacer`, `goto` |
| `chips` | a row of token chips | `items[]`: `text`, `sub`, `hot`, `dim` |
| `bars` | horizontal bars | `items[]`: `label`, `value` (0–1), `display`; `layout`: `inline` or `stacked` |
| `table` | small labelled table | `rows[]`: `head`, `cells[]`: `text`, `tone` |
| `stat` | big-number tiles | `items[]`: `value`, `label` |
| `code` | code block | `source[]` (lines), `title` |
| `shape` | highlighted monospace tag | `text` |
| `panel` | group several blocks in one panel | `blocks[]` |
| `tabs` | buttons that switch between views | `tabs[]`: `label`, `blocks[]` |
| `stepper` | click-through sequence | `steps[]`: `blocks[]` or `item`, plus `caption`; `accumulate: true` grows a `stages` list one row per step |
| `widget` | a named interactive component | `name`, `props` |

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
