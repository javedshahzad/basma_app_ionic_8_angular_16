import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ClasslistPage } from './classlist.page';

const routes: Routes = [
  {
    path: '',
    component: ClasslistPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ClasslistPageRoutingModule {}
