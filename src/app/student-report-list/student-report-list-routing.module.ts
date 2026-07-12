import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StudentReportListPage } from './student-report-list.page';

const routes: Routes = [
  {
    path: '',
    component: StudentReportListPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StudentReportListPageRoutingModule {}
