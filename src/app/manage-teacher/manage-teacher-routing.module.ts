import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ManageTeacherPage } from './manage-teacher.page';

const routes: Routes = [
  {
    path: '',
    component: ManageTeacherPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ManageTeacherPageRoutingModule {}
