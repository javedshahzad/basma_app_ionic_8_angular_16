import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SendmessagePage } from './sendmessage.page';

const routes: Routes = [
  {
    path: '',
    component: SendmessagePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SendmessagePageRoutingModule {}
