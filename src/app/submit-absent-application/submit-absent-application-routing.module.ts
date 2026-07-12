import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SubmitAbsentApplicationPage } from './submit-absent-application.page';

const routes: Routes = [
  {
    path: '',
    component: SubmitAbsentApplicationPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SubmitAbsentApplicationPageRoutingModule {}
