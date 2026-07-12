import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ViewBulletinPage } from './view-bulletin.page';

const routes: Routes = [
  {
    path: '',
    component: ViewBulletinPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ViewBulletinPageRoutingModule {}
