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
 * Opens in Read mode unless the URL says otherwise (`?mode=watch`, or `?` for the default).
 */
async function open(url: string) {
  const harness = await RouterTestingHarness.create();
  if (!url.includes('?')) url += '?mode=read';
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
    expect(router.url.split('?')[0]).toBe(`/${SECTIONS[1].chapters[0].id}/1`);
    expect(tabs[1].getAttribute('aria-current')).toBe('page');
  });

  it('jumps to a chapter or a slide from the outline', async () => {
    const { el, router, settle } = await open(`/${SECTIONS[1].chapters[0].id}/1`);
    (el.querySelectorAll('aside .ch')[1] as HTMLButtonElement).click();
    await settle();
    expect(router.url.split('?')[0]).toBe('/' + SECTIONS[1].chapters[1].id + '/1');
    (el.querySelectorAll('aside .slides .sbtn')[2] as HTMLButtonElement).click();
    await settle();
    expect(router.url.split('?')[0]).toBe('/' + SECTIONS[1].chapters[1].id + '/3');
  });

  it('moves to the next slide and across chapters', async () => {
    const { el, router, settle } = await open(`/${COURSE[0].id}/${COURSE[0].slides.length}`);
    (el.querySelector('.foot .next') as HTMLButtonElement).click();
    await settle();
    expect(router.url.split('?')[0]).toBe(`/${COURSE[1].id}/1`);
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
    expect(router.url.split('?')[0]).toBe(`/${COURSE[0].id}/1`);
  });

  it('opens old single-segment links like #assistant at slide 1', async () => {
    const { router } = await open(`/${COURSE[1].id}`);
    expect(router.url.split('?')[0]).toBe(`/${COURSE[1].id}/1`);
  });

  describe('watch mode', () => {
    const withVideo = COURSE.find((c) => c.videos?.length)!;
    const withoutVideo = COURSE.find((c) => !c.videos?.length)!;

    it("shows the slide's video, then steps video by video and on to the next chapter", async () => {
      const { el, router, settle } = await open(
        `/${withVideo.id}/${withVideo.videos![0].slides?.[0] ?? 1}?mode=watch`,
      );
      const vids = withVideo.videos!;
      expect(el.querySelector('article h2')?.textContent).toBe(vids[0].title);
      expect(el.querySelector('app-video-player video')?.getAttribute('src')).toBe(vids[0].src);
      expect(el.querySelector('.chapter-bar .of')?.textContent).toContain('video');
      const next = () => el.querySelector('.foot .next') as HTMLButtonElement;
      for (const v of vids.slice(1)) {
        expect(next().textContent).toContain(v.title);
        next().click();
        await settle();
        expect(el.querySelector('article h2')?.textContent).toBe(v.title);
        expect(router.url).toBe(`/${withVideo.id}/${v.slides?.[0] ?? 1}?mode=watch`);
      }
      const i = COURSE.indexOf(withVideo);
      expect(next().textContent).toContain(COURSE[i + 1].name);
      next().click();
      await settle();
      expect(router.url).toBe(`/${COURSE[i + 1].id}/1?mode=watch`);
    });

    it("lists the chapter's videos when there is more than one", async () => {
      const { el } = await open(`/${withVideo.id}/1?mode=watch`);
      const items = el.querySelectorAll('.playlist li');
      expect(items.length).toBe(withVideo.videos!.length > 1 ? withVideo.videos!.length : 0);
    });

    it('skips 5 seconds with the arrow keys instead of changing slide', async () => {
      const { el, router, settle } = await open(`/${withVideo.id}/1?mode=watch`);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
      await settle();
      expect(router.url).toBe(`/${withVideo.id}/1?mode=watch`);
      expect(el.querySelector('.flash')?.textContent).toContain('10 seconds');
    });

    it('offers the slides when a chapter has no video yet', async () => {
      const { el, router, settle } = await open(`/${withoutVideo.id}/1?mode=watch`);
      expect(el.querySelector('article h2')?.textContent).toContain('No video');
      (el.querySelector('.empty .btn.on') as HTMLButtonElement).click();
      await settle();
      expect(el.querySelector('article h2')?.textContent).toBe(withoutVideo.slides[0].title);
      expect(router.url).toBe(`/${withoutVideo.id}/1?mode=read`);
    });

    it('shows only chapters in the outline, without slide lists', async () => {
      const { el } = await open(`/${withVideo.id}/1?mode=watch`);
      expect(el.querySelector('aside .ch[aria-current="page"]')).not.toBeNull();
      expect(el.querySelector('aside .slides')).toBeNull();
      expect(el.querySelector('aside .chev')).toBeNull();
    });

    it('is a course-wide switch in the header', async () => {
      const { el, settle } = await open(`/${withVideo.id}/1?mode=watch`);
      const read = el.querySelector('header app-mode-switch button') as HTMLButtonElement;
      read.click();
      await settle();
      expect(el.querySelector('article h2')?.textContent).toBe(withVideo.slides[0].title);
      expect(el.querySelector('aside .slides')).not.toBeNull();
    });

    it('keeps the chosen mode in the URL, so a reload or a shared link opens the same view', async () => {
      const { el, router, settle } = await open(`/${withVideo.id}/1?mode=watch`);
      (el.querySelector('header app-mode-switch button') as HTMLButtonElement).click();
      await settle();
      expect(router.url).toBe(`/${withVideo.id}/1?mode=read`);
      (el.querySelector('.foot .next') as HTMLButtonElement).click();
      await settle();
      expect(router.url).toBe(`/${withVideo.id}/2?mode=read`);
    });

    it('opens Watch by default when the chapter has a video, Read when it has none', async () => {
      const { el, router, settle } = await open(`/${withVideo.id}/1?`);
      expect(el.querySelector('app-video-player')).not.toBeNull();
      await router.navigateByUrl(`/${withoutVideo.id}/1`);
      await settle();
      expect(el.querySelector('article h2')?.textContent).toBe(withoutVideo.slides[0].title);
    });
  });
});
