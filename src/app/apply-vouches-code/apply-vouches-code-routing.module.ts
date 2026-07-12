import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ApplyVouchesCodePage } from './apply-vouches-code.page';

const routes: Routes = [
  {
    path: '',
    component: ApplyVouchesCodePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ApplyVouchesCodePageRoutingModule {}
