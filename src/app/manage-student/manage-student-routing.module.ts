import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ManageStudentPage } from './manage-student.page';

const routes: Routes = [
  {
    path: '',
    component: ManageStudentPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ManageStudentPageRoutingModule {}
