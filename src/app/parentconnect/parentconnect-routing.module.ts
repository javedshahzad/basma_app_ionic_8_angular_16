import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ParentconnectPage } from './parentconnect.page';

const routes: Routes = [
  {
    path: '',
    component: ParentconnectPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ParentconnectPageRoutingModule {}
