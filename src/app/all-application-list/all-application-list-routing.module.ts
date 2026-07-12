import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AllApplicationListPage } from './all-application-list.page';

const routes: Routes = [
  {
    path: '',
    component: AllApplicationListPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AllApplicationListPageRoutingModule {}
