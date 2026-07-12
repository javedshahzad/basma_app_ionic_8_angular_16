import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FollowupStudentListPage } from './followup-student-list.page';

const routes: Routes = [
  {
    path: '',
    component: FollowupStudentListPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FollowupStudentListPageRoutingModule {}
