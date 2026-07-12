import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ViewApplicationDetailsPage } from './view-application-details.page';

const routes: Routes = [
  {
    path: '',
    component: ViewApplicationDetailsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ViewApplicationDetailsPageRoutingModule {}
