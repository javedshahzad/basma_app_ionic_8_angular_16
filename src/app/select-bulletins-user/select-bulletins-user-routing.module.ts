import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SelectBulletinsUserPage } from './select-bulletins-user.page';

const routes: Routes = [
  {
    path: '',
    component: SelectBulletinsUserPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SelectBulletinsUserPageRoutingModule {}
