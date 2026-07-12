import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EditUserProfilePage } from './edit-user-profile.page';

const routes: Routes = [
  {
    path: '',
    component: EditUserProfilePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EditUserProfilePageRoutingModule {}
