import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AddParentPage } from './add-parent.page';

const routes: Routes = [
  {
    path: '',
    component: AddParentPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AddParentPageRoutingModule {}
