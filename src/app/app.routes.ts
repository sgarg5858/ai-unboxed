import { Routes } from '@angular/router';
import { CHAPTERS } from '../content/course';
import { chapterResolver } from './course/chapter.resolver';
import { CourseShell } from './course/course-shell/course-shell';

const start = `/${CHAPTERS[0].id}/1`;

/**
 * #/chapterId/slide (1-based). The resolver loads that chapter's content (and its widgets)
 * before the shell renders it; CourseNav reads the position from the URL.
 */
export const routes: Routes = [
  { path: ':chapter/:slide', component: CourseShell, resolve: { chapter: chapterResolver } },
  // Older links such as #assistant open the chapter's first slide.
  { path: ':chapter', redirectTo: ({ params }) => `/${params['chapter']}/1` },
  { path: '**', redirectTo: start },
];
