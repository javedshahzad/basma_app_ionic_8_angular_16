import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RequestedParentPage } from './requested-parent.page';

const routes: Routes = [
  {
    path: '',
    component: RequestedParentPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RequestedParentPageRoutingModule {}
