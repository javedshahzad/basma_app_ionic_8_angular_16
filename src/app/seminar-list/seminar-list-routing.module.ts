import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SeminarListPage } from './seminar-list.page';

const routes: Routes = [
  {
    path: '',
    component: SeminarListPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SeminarListPageRoutingModule {}
