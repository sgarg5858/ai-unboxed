import Ajv from 'ajv';
import { WIDGETS } from '../app/widgets/registry';
import { allBlocks } from '../app/course/blocks-walk';
import { CHAPTERS, SECTIONS } from './course';
import schema from './schema/chapter.schema.json';

// The app loads chapters on demand; the tests load them all up front.
const COURSE = await Promise.all(CHAPTERS.map((c) => c.load()));
// Node's fs, to check video files exist (the specs don't include Node's types).
const fs = 'node:fs';
const { existsSync } = (await import(/* @vite-ignore */ fs)) as {
  existsSync: (path: string) => boolean;
};

describe('course content', () => {
  const validate = new Ajv({ allErrors: true, strict: false }).compile(schema);

  for (const chapter of COURSE) {
    it(`${chapter.id} matches chapter.schema.json`, () => {
      const ok = validate(chapter);
      expect(validate.errors ?? [], JSON.stringify(validate.errors, null, 2)).toEqual([]);
      expect(ok).toBe(true);
    });
  }

  it('groups every chapter into exactly one section, in reading order', () => {
    expect(SECTIONS.flatMap((x) => x.chapters.map((c) => c.id))).toEqual(CHAPTERS.map((c) => c.id));
    expect(SECTIONS.every((x) => x.chapters.length > 0)).toBe(true);
    expect(new Set(SECTIONS.map((x) => x.id)).size).toBe(SECTIONS.length);
  });

  it('lists every chapter in the manifest with the same id and name as its JSON', () => {
    expect(CHAPTERS.map((c) => [c.id, c.name])).toEqual(COURSE.map((c) => [c.id, c.name]));
  });

  it('has unique chapter ids', () => {
    const ids = COURSE.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('only references registered widgets', () => {
    const used = COURSE.flatMap((c) => c.slides.flatMap((s) => [...allBlocks(s.viz)]))
      .filter((b) => b.type === 'widget')
      .map((b) => (b as { name: string }).name);
    expect(used.filter((n) => !WIDGETS[n])).toEqual([]);
  });

  it('keeps the schema widget list in sync with the registry', () => {
    const block = (
      schema.definitions.block.allOf as { then: { properties: { name?: { enum: string[] } } } }[]
    )
      .map((r) => r.then.properties.name?.enum)
      .find(Boolean);
    expect([...(block ?? [])].sort()).toEqual(Object.keys(WIDGETS).sort());
  });

  it('gives every video timestamps and a slide range inside its chapter', () => {
    for (const c of COURSE)
      for (const v of c.videos ?? []) {
        const where = `${c.id}: ${v.src}`;
        const marks = v.marks ?? [];
        expect(marks.length, `${where} has no timestamps`).toBeGreaterThan(0);
        expect(marks[0].at, `${where} timestamps start at 0`).toBe(0);
        marks.forEach((m, i) => i && expect(m.at, where).toBeGreaterThan(marks[i - 1].at));
        const [first, last] = v.slides ?? [1, c.slides.length];
        expect(first >= 1 && first <= last && last <= c.slides.length, where).toBe(true);
        for (const k of Object.keys(v.at ?? {}))
          expect(+k >= 1 && +k <= c.slides.length, `${where}: "at" slide ${k} doesn't exist`).toBe(
            true,
          );
      }
  });

  it('points every video at a file in src/content/videos/<chapter>/', () => {
    const missing = COURSE.flatMap((c) =>
      (c.videos ?? [])
        .map((v) => v.src)
        .filter((src) => !/^https?:/.test(src) && !existsSync(`src/content/${src}`))
        .map((src) => `${c.id}: ${src}`),
    );
    expect(missing).toEqual([]);
  });

  it('has goto links that point at real slides', () => {
    const broken: string[] = [];
    for (const c of COURSE)
      for (const s of c.slides)
        for (const b of allBlocks(s.viz))
          if (b.type === 'stages')
            for (const it of b.items) {
              if (!it.goto) continue;
              const target = COURSE.find((x) => x.id === it.goto!.chapter);
              if (!target || (it.goto.slide ?? 1) > target.slides.length)
                broken.push(`${c.id}: ${it.label} → ${JSON.stringify(it.goto)}`);
            }
    for (const c of COURSE)
      for (const s of c.slides)
        for (const p of s.body) {
          if (typeof p === 'string' || !('more' in p) || !p.goto) continue;
          const target = COURSE.find((x) => x.id === p.goto!.chapter);
          if (!target || (p.goto.slide ?? 1) > target.slides.length)
            broken.push(`${c.id}: ${p.more} → ${JSON.stringify(p.goto)}`);
        }
    expect(broken).toEqual([]);
  });
});
