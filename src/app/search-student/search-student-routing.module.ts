import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SearchStudentPage } from './search-student.page';

const routes: Routes = [
  {
    path: '',
    component: SearchStudentPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SearchStudentPageRoutingModule {}
