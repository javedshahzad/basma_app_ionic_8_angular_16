import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UserSelectionPage } from './user-selection.page';

const routes: Routes = [
  {
    path: '',
    component: UserSelectionPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UserSelectionPageRoutingModule {}
