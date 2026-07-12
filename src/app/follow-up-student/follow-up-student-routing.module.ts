import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FollowUpStudentPage } from './follow-up-student.page';

const routes: Routes = [
  {
    path: '',
    component: FollowUpStudentPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FollowUpStudentPageRoutingModule {}
