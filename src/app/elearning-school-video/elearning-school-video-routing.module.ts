import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ElearningSchoolVideoPage } from './elearning-school-video.page';

const routes: Routes = [
  {
    path: '',
    component: ElearningSchoolVideoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ElearningSchoolVideoPageRoutingModule {}
