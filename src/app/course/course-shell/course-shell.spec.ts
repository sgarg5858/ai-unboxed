import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { CHAPTERS, SECTIONS } from '../../../content/course';
import { ChapterStore } from '../chapter-store';
import { routes } from '../../app.routes';
import { CourseShell } from './course-shell';

// The app loads chapters on demand; the tests load them all up front to know every slide.
const COURSE = await Promise.all(CHAPTERS.map((c) => c.load()));

/**
 * Render the shell through the router, exactly as the app does: the route resolver loads the
 * chapter first, then the shell appears. (Creating the shell directly would render it before any
 * chapter has loaded, which can't happen in the real app.) Only one harness per test.
 */
async function open(url: string) {
  const harness = await RouterTestingHarness.create();
  await harness.navigateByUrl(url, CourseShell);
  await harness.fixture.whenStable();
  return {
    el: harness.routeNativeElement as HTMLElement,
    router: TestBed.inject(Router),
    settle: () => harness.fixture.whenStable(),
  };
}

describe('CourseShell', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  });

  // Renders every slide in the course, so broken content or widgets fail CI.
  for (const chapter of COURSE) {
    chapter.slides.forEach((slide, i) => {
      it(`renders ${chapter.id}/${i + 1}: ${slide.title}`, async () => {
        const { el } = await open(`/${chapter.id}/${i + 1}`);
        expect(el.querySelector('article h2')?.textContent).toBe(slide.title);
        expect(el.textContent).not.toContain('Unknown widget');
        if (slide.viz?.length) expect(el.querySelector('.viz')!.children.length).toBeGreaterThan(0);
      });
    });
  }

  it("lists the current section's chapters in the sidebar, with the current one expanded", async () => {
    const { el, settle } = await open('/attention/2');
    const attention = COURSE.find((c) => c.id === 'attention')!;
    const section = SECTIONS.find((s) => s.chapters.some((c) => c.id === 'attention'))!;
    const outline = el.querySelector('aside app-course-outline')!;
    const names = Array.from(outline.querySelectorAll('.ch .name')).map((n) => n.textContent);
    expect(names).toEqual(section.chapters.map((c) => c.name));
    expect(outline.querySelector('.ch[aria-current="page"]')?.textContent).toContain('Attention');
    expect(outline.querySelectorAll('.slides .sbtn').length).toBe(attention.slides.length);
    expect(outline.querySelector('.slides [aria-current="step"]')?.textContent).toContain(
      attention.slides[1].title,
    );
    // Collapse it with its chevron.
    (outline.querySelector('.current .chev') as HTMLButtonElement).click();
    await settle();
    expect(outline.querySelector('.slides')).toBeNull();
    expect(el.querySelector('.chapter-bar .name')?.textContent).toBe('Attention');
  });

  it('ticks a slide done and saves it', async () => {
    const { el, settle } = await open('/attention/2');
    const check = el.querySelectorAll('aside .slides .check')[0] as HTMLButtonElement;
    expect(check.getAttribute('aria-checked')).toBe('false');
    check.click();
    await settle();
    expect(check.getAttribute('aria-checked')).toBe('true');
    expect(localStorage.getItem('ai-unboxed:read')).toContain('attention/0');
    check.click();
    await settle();
    expect(check.getAttribute('aria-checked')).toBe('false');
    expect(localStorage.getItem('ai-unboxed:read')).not.toContain('attention/0');
  });

  it('helps keyboard users: skip link, shortcuts list, slide title, announcement', async () => {
    const { el, settle } = await open('/attention/2');
    const attention = COURSE.find((c) => c.id === 'attention')!;
    const skip = document.querySelector('a.skip') as HTMLAnchorElement;
    expect(skip.textContent).toContain('Skip to slide');
    skip.click();
    expect(document.activeElement?.id).toBe('slide-main');
    expect(document.title).toContain(attention.slides[1].title);
    expect(el.querySelector('main [aria-live="polite"]')?.textContent).toContain('Slide 2 of');
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }));
    await settle();
    expect(el.querySelector('app-shortcuts-help h2')?.textContent).toBe('Keyboard shortcuts');
  });

  it('switches section with the tabs', async () => {
    const { el, router, settle } = await open(`/${COURSE[0].id}/1`);
    const tabs = el.querySelectorAll('app-section-tabs button');
    expect(tabs.length).toBe(SECTIONS.length);
    (tabs[1] as HTMLButtonElement).click();
    await settle();
    expect(router.url).toBe(`/${SECTIONS[1].chapters[0].id}/1`);
    expect(tabs[1].getAttribute('aria-current')).toBe('page');
  });

  it('jumps to a chapter or a slide from the outline', async () => {
    const { el, router, settle } = await open(`/${SECTIONS[1].chapters[0].id}/1`);
    (el.querySelectorAll('aside .ch')[1] as HTMLButtonElement).click();
    await settle();
    expect(router.url).toBe('/' + SECTIONS[1].chapters[1].id + '/1');
    (el.querySelectorAll('aside .slides .sbtn')[2] as HTMLButtonElement).click();
    await settle();
    expect(router.url).toBe('/' + SECTIONS[1].chapters[1].id + '/3');
  });

  it('moves to the next slide and across chapters', async () => {
    const { el, router, settle } = await open(`/${COURSE[0].id}/${COURSE[0].slides.length}`);
    (el.querySelector('.foot .next') as HTMLButtonElement).click();
    await settle();
    expect(router.url).toBe(`/${COURSE[1].id}/1`);
  });

  it('opens search with / and finds slides in any chapter', async () => {
    const { el, settle } = await open('/assistant/1');
    await TestBed.inject(ChapterStore).preloadAll();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: '/' }));
    await settle();
    const input = el.querySelector('app-command-palette input') as HTMLInputElement;
    input.value = 'cosine';
    input.dispatchEvent(new Event('input'));
    await settle();
    const hits = Array.from(el.querySelectorAll('app-command-palette [role="option"]'));
    expect(hits[0]?.textContent).toContain('Cosine');
    expect(input.getAttribute('aria-activedescendant')).toBe(hits[0].id);
  });

  it('sends unknown chapters to the start', async () => {
    const { router } = await open('/nope/3');
    expect(router.url).toBe(`/${COURSE[0].id}/1`);
  });

  it('opens old single-segment links like #assistant at slide 1', async () => {
    const { router } = await open(`/${COURSE[1].id}`);
    expect(router.url).toBe(`/${COURSE[1].id}/1`);
  });
});
