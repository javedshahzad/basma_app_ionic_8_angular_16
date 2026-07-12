import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ListStudentPage } from './list-student.page';

const routes: Routes = [
  {
    path: '',
    component: ListStudentPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ListStudentPageRoutingModule {}
