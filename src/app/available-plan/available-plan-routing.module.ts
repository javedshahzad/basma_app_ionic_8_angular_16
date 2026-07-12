import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AvailablePlanPage } from './available-plan.page';

const routes: Routes = [
  {
    path: '',
    component: AvailablePlanPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AvailablePlanPageRoutingModule {}
