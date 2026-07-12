import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RegisterTeacherPage } from './register-teacher.page';

const routes: Routes = [
  {
    path: '',
    component: RegisterTeacherPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RegisterTeacherPageRoutingModule {}
