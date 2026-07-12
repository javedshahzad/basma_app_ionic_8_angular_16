import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ParentRegisterPage } from './parent-register.page';

const routes: Routes = [
  {
    path: '',
    component: ParentRegisterPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ParentRegisterPageRoutingModule {}
