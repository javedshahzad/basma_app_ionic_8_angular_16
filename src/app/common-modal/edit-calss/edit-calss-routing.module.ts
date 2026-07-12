import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EditCalssPage } from './edit-calss.page';

const routes: Routes = [
  {
    path: '',
    component: EditCalssPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EditCalssPageRoutingModule {}
