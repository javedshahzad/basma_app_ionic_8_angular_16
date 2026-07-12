import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EditStudentProfilePage } from './edit-student-profile.page';

const routes: Routes = [
  {
    path: '',
    component: EditStudentProfilePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EditStudentProfilePageRoutingModule {}
