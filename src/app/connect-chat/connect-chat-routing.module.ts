import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ConnectChatPage } from './connect-chat.page';

const routes: Routes = [
  {
    path: '',
    component: ConnectChatPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConnectChatPageRoutingModule {}
