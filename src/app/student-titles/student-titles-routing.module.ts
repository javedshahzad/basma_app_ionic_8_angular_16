import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StudentTitlesPage } from './student-titles.page';

const routes: Routes = [
  {
    path: '',
    component: StudentTitlesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StudentTitlesPageRoutingModule {}
