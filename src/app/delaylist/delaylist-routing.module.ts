import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DelaylistPage } from './delaylist.page';

const routes: Routes = [
  {
    path: '',
    component: DelaylistPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DelaylistPageRoutingModule {}
