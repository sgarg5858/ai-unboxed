import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { COURSE } from '../../../content/course';
import { routes } from '../../app.routes';
import { CourseShell } from './course-shell';

describe('CourseShell', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter(routes)] });
  });

  // Renders every slide in the course, so broken content or widgets fail CI.
  for (const chapter of COURSE) {
    chapter.slides.forEach((slide, i) => {
      it(`renders ${chapter.id}/${i + 1}: ${slide.title}`, async () => {
        const fixture = TestBed.createComponent(CourseShell);
        await TestBed.inject(Router).navigateByUrl(`/${chapter.id}/${i + 1}`);
        await fixture.whenStable();
        const el = fixture.nativeElement as HTMLElement;
        expect(el.querySelector('article h2')?.textContent).toBe(slide.title);
        expect(el.textContent).not.toContain('Unknown widget');
        if (slide.viz?.length) expect(el.querySelector('.viz')!.children.length).toBeGreaterThan(0);
      });
    });
  }

  it('lists every chapter by name in the outline and marks the current one', async () => {
    const fixture = TestBed.createComponent(CourseShell);
    const router = TestBed.inject(Router);
    const el = fixture.nativeElement as HTMLElement;
    await router.navigateByUrl('/attention/2');
    await fixture.whenStable();
    const outline = el.querySelector('aside app-course-outline')!;
    const names = Array.from(outline.querySelectorAll('.ch .name')).map((n) => n.textContent);
    expect(names).toEqual(COURSE.map((c) => c.name));
    expect(outline.querySelector('.ch[aria-current="page"]')?.textContent).toContain('Attention');
    const slides = outline.querySelectorAll('.slides button');
    expect(slides.length).toBe(COURSE.find((c) => c.id === 'attention')!.slides.length);
    expect(outline.querySelector('.slides [aria-current="step"]')?.textContent?.trim()).toBe(
      COURSE.find((c) => c.id === 'attention')!.slides[1].title,
    );
    expect(el.querySelector('.chapter-bar .name')?.textContent).toBe('Attention');
  });

  it('jumps to a chapter or a slide from the outline', async () => {
    const fixture = TestBed.createComponent(CourseShell);
    const router = TestBed.inject(Router);
    const el = fixture.nativeElement as HTMLElement;
    await router.navigateByUrl('/assistant/1');
    await fixture.whenStable();
    (el.querySelectorAll('aside .ch')[1] as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(router.url).toBe('/' + COURSE[1].id + '/1');
    (el.querySelectorAll('aside .slides button')[2] as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(router.url).toBe('/' + COURSE[1].id + '/3');
  });

  it('moves to the next slide and across chapters', async () => {
    const fixture = TestBed.createComponent(CourseShell);
    const router = TestBed.inject(Router);
    await router.navigateByUrl(`/${COURSE[0].id}/${COURSE[0].slides.length}`);
    await fixture.whenStable();
    (fixture.nativeElement.querySelector('.foot .btn:last-child') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(router.url).toBe(`/${COURSE[1].id}/1`);
  });
});
