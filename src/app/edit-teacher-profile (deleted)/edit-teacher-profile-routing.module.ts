import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EditTeacherProfilePage } from './edit-teacher-profile.page';

const routes: Routes = [
  {
    path: '',
    component: EditTeacherProfilePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EditTeacherProfilePageRoutingModule {}
