import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { FollowupAddFieldsPage } from './followup-add-fields.page';

const routes: Routes = [
  {
    path: '',
    component: FollowupAddFieldsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FollowupAddFieldsPageRoutingModule {}
