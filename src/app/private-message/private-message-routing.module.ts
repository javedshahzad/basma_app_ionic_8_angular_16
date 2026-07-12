import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PrivateMessagePage } from './private-message.page';

const routes: Routes = [
  {
    path: '',
    component: PrivateMessagePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PrivateMessagePageRoutingModule {}
