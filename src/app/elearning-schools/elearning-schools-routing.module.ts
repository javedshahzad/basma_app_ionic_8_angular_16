import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ElearningSchoolsPage } from './elearning-schools.page';

const routes: Routes = [
  {
    path: '',
    component: ElearningSchoolsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ElearningSchoolsPageRoutingModule {}
