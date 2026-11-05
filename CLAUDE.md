# CLAUDE.md

**AI, Unboxed** is an interactive course on how modern AI works, built as an Angular 21 static site and deployed to GitHub Pages. Read [ARCHITECTURE.md](ARCHITECTURE.md) before making structural changes.

## Commands

```bash
npm start                    # dev server, http://localhost:4200
npm test -- --watch=false    # Vitest: schema-validates all content + renders every slide
npm run build                # production build → dist/ai-unboxed/browser
npx prettier --write <files> # format (printWidth 100, single quotes)
```

Before calling a task done:

1. `npm test -- --watch=false` passes.
2. `npm run build` passes with no new budget warnings.
3. For UI changes, the slide has been checked in the browser in **both light and dark** themes.

## Golden rule

**Content and layout go in JSON. Behaviour goes in code.**

- **Text or slides:** edit `src/content/chapters/*.json` only. Use generic blocks (stages, chips, bars, table, stat, panel, tabs, stepper, caption, code).
- **Widgets:** write one only when the interaction computes something. To add one:
  1. Add the component to `src/app/widgets/<topic>.widgets.ts`.
  2. Register it in `widgets/registry.ts`.
  3. Add its name to the widget `enum` in `src/content/schema/chapter.schema.json`.
- **Cross-chapter links:** use `goto: { chapter: "<id>", slide: n }` and refer to the chapter by **name** in prose, never by number.
- **New chapter:** add the JSON file with its `$schema` line, import it in `src/content/course.ts`, add it to a section, and update the chapter table in `README.md`.

## Angular 21 conventions (follow strictly)

Based on angular.dev's official best-practices guide (`/assets/context/best-practices.md`) and the zoneless guide, adapted to this repo.

### Components

- Standalone only. **Do not** write `standalone: true`; it has been the default since v20.
- **Always set `changeDetection: ChangeDetectionStrategy.OnPush`.** It only becomes the default in v22, and this app is zoneless.
- Use `input()`, `input.required()`, `output()` and `model()`. Never use `@Input`, `@Output` or `@HostBinding`/`@HostListener`. Put host bindings and listeners in the `host: {}` object.
- Expose template-only members as `protected readonly`, and public inputs as `readonly`.
- Use inline templates for small components and widgets. Use `templateUrl`/`styleUrl` once a template or stylesheet grows large (see `course-shell/`).
- Use `[class.x]` and `[style.x]` bindings. Never use `ngClass`, `ngStyle` or `CommonModule`; import only what the template uses (for example `NgComponentOutlet`).
- Keep each component small and single-purpose, and keep logic out of templates: move it into `computed()`.
- Accessibility: meet WCAG AA and pass AXE checks.
  - Interactive non-buttons need `role`, `tabindex` and keyboard handlers.
  - Tabs use `role="tab"` and `aria-selected`.
  - Every SVG diagram needs `role="img"` and an `aria-label`.

### State: signals only (the app is zoneless)

- There is no zone.js. The UI updates only when a template-read signal changes, an input is set, or a bound event fires. Plain mutable fields read by a template **will not re-render**.
- Use `signal()` for local state, `computed()` for derived state, `linkedSignal()` for state that resets when an input changes, and `model()` for two-way binding.
- Update with `.set()` or `.update()` and new objects or arrays. Never mutate a signal's value in place.
- Use `effect()` only for syncing to the outside world (DOM attributes, `localStorage`); see `shared/theme/theme.ts`. Never use it to copy one signal into another; use `computed` or `linkedSignal` instead.
- Bridge RxJS with `toSignal()` (see `course/course-nav.ts`). Never subscribe manually in components.
- Don't use `NgZone.onStable`/`onMicrotaskEmpty`. Use `afterNextRender` or `afterEveryRender` for DOM work.

### Templates

- Use built-in control flow: `@if`, `@for` (always with `track`), `@switch` and `@let`. Never use `*ngIf` or `*ngFor`.
- Prefer `@defer` for heavy widgets if the initial bundle nears the 500 kB budget.

### Services and DI

- Use `inject()`, never constructor-parameter injection.
- Use `@Injectable({ providedIn: 'root' })` for singletons, each with one responsibility.
- Swap data through `InjectionToken`s (for example `COURSE_CONTENT`, which tests override).

### Navigation

- The **URL is the only source of truth** for the current slide. Navigate through `CourseNav` (`goto`, `gotoSlide`, `step`). Never store "current slide" in a component.
- Routing uses hash URLs (`#/chapterId/slide`, 1-based slide number) with a single wildcard route. Keep it that way so GitHub Pages works without rewrites.

### TypeScript

- Strict mode and `strictTemplates` are on. Never use `any`; use `unknown` and narrow it. `$any` is allowed only for `$event.target` casts in templates.
- Rely on inference when a type is obvious. Use the discriminated `Block` union in `content.model.ts` for content types.
- Put pure logic (math, tokenizer, toy model, position) in plain functions under `shared/lib/` or `course/course-position.ts`, and unit-test it without TestBed.

## Styling rules

- **Global (`src/styles.css`) holds only:** design tokens (light and dark), reset, shared primitives (`.panel`, `.btn`, `.stage`, `.chip`, `.cap`, `.stat`, `.row`…), and rules for `[innerHTML]` content that Angular can't scope.
- **Everything else** goes in the component's own styles. Component stylesheets have a budget of 4 kB (warning) and 8 kB (error).
- **Never hard-code colours.** Use tokens.
  - Text uses the `*-ink` tokens (`--accent-ink`, `--pos-ink`, `--neg-ink`, `--heat-ink`) or `--ink` and `--muted`.
  - The bare `--accent`, `--pos`, etc. are for fills and strokes only.
  - Map content tones with `toneColor()` from `blocks/tone.ts`.
- **New tokens** must be defined in the light `:root` block **and** both dark blocks (`@media (prefers-color-scheme: dark) :root:not([data-theme=light])` and `[data-theme=dark]`).
- **Theme switching:** the `Theme` service and the inline script in `index.html` share the `ai-unboxed:theme` key. Keep them in sync.

## Testing

- Vitest runs through `ng test` (jsdom). Spec files sit next to their source as `*.spec.ts`.
- `course.spec.ts` checks:
  - every chapter against the JSON Schema;
  - unique chapter ids;
  - that every chapter belongs to exactly one section;
  - that used widgets are registered;
  - that the schema enum matches the registry.
- `course-shell.spec.ts` renders every slide. Counts come from `COURSE`, so **don't hard-code chapter or slide counts**.
- Zoneless TestBed: prefer `await fixture.whenStable()`. jsdom lacks some DOM APIs (`scrollIntoView`), so guard optional calls with `?.`.

## Gotchas

- JSON imports are widened, so `course.ts` casts them through `chapter()`. The tests, not the compiler, catch content mistakes.
- Prettier may reformat files after edits. Re-read a file before making exact-match edits.
- `dist/` is build output. Never edit it.
- The deploy workflow sets `--base-href` from the repo name. Don't hard-code `/ai-unboxed/` anywhere in the source.
- Prose and caption strings allow inline HTML (`<b>`, `<code>`, `<span class="k">`), which is rendered with `[innerHTML]`. Keep it to simple formatting tags.
