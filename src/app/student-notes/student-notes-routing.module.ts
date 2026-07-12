import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StudentNotesPage } from './student-notes.page';

const routes: Routes = [
  {
    path: '',
    component: StudentNotesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StudentNotesPageRoutingModule {}
