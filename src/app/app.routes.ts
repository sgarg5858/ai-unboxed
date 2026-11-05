import { Routes } from '@angular/router';
import { CourseShell } from './course/course-shell/course-shell';

/** Every URL renders the shell; CourseNav reads /:chapter/:slide from the URL itself. */
export const routes: Routes = [{ path: '**', component: CourseShell }];
