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
