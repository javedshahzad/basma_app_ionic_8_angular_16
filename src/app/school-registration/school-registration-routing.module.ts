import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SchoolRegistrationPage } from './school-registration.page';

const routes: Routes = [
  {
    path: '',
    component: SchoolRegistrationPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SchoolRegistrationPageRoutingModule {}
