import { inject } from '@angular/core';
import { RedirectCommand, ResolveFn, Router } from '@angular/router';
import { COURSE_CHAPTERS, ChapterStore } from './chapter-store';
import { START_CHAPTER } from '../../content/course';
import { ChapterContent } from './content.model';

/** Loads the chapter named in the URL before the slide renders; unknown ids go to the start. */
export const chapterResolver: ResolveFn<ChapterContent> = (route) => {
  const chapters = inject(COURSE_CHAPTERS);
  const id = route.paramMap.get('chapter') ?? '';
  if (!chapters.some((c) => c.id === id)) {
    const start = chapters.some((c) => c.id === START_CHAPTER) ? START_CHAPTER : chapters[0].id;
    return new RedirectCommand(inject(Router).parseUrl(`/${start}/1`));
  }
  return inject(ChapterStore).load(id);
};
