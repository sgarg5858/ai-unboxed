import { allBlocks } from '../course/blocks-walk';
import { CHAPTERS } from '../../content/course';
import { ROADMAP, coverage } from './roadmap.widgets';

const COURSE = await Promise.all(CHAPTERS.map((c) => c.load()));

describe('course roadmap', () => {
  it('links every covered topic to a real slide', () => {
    const broken = ROADMAP.flatMap((g) =>
      g.topics
        .filter((t) => t.goto)
        .filter((t) => {
          const target = COURSE.find((c) => c.id === t.goto!.chapter);
          return !target || (t.goto!.slide ?? 1) > target.slides.length;
        })
        .map((t) => `${g.id}: ${t.name} → ${JSON.stringify(t.goto)}`),
    );
    expect(broken).toEqual([]);
  });

  it('has no duplicate areas or topics', () => {
    expect(new Set(ROADMAP.map((g) => g.id)).size).toBe(ROADMAP.length);
    for (const g of ROADMAP)
      expect(new Set(g.topics.map((t) => t.name)).size).toBe(g.topics.length);
  });

  it('points each area at the Roadmap slide that lists it', () => {
    const chapter = COURSE.find((c) => c.id === 'roadmap')!;
    for (const g of ROADMAP) {
      const slide = chapter.slides[g.slide - 1];
      const groups = [...allBlocks(slide?.viz ?? [])].map((b) =>
        b.type === 'widget' ? (b.props as { group?: string } | undefined)?.group : undefined,
      );
      expect(groups, g.id).toContain(g.id);
    }
  });

  it('counts covered topics', () => {
    expect(coverage([{ name: 'a', goto: { chapter: 'x' } }, { name: 'b' }])).toEqual({
      done: 1,
      total: 2,
      pct: 50,
    });
  });
});
