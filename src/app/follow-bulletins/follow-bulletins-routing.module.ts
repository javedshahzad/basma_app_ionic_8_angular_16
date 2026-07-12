import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FollowBulletinsPage } from './follow-bulletins.page';

const routes: Routes = [
  {
    path: '',
    component: FollowBulletinsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FollowBulletinsPageRoutingModule {}
