import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AbsentStudentsPage } from './absent-students.page';

const routes: Routes = [
  {
    path: '',
    component: AbsentStudentsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AbsentStudentsPageRoutingModule {}
