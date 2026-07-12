import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SelectMessageUserPage } from './select-message-user.page';

const routes: Routes = [
  {
    path: '',
    component: SelectMessageUserPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SelectMessageUserPageRoutingModule {}
