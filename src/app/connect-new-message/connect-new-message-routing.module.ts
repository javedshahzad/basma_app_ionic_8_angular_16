import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConnectNewMessagePage } from './connect-new-message.page';

const routes: Routes = [
  {
    path: '',
    component: ConnectNewMessagePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConnectNewMessagePageRoutingModule {}
