import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StudentReportManagePage } from './student-report-manage.page';

const routes: Routes = [
  {
    path: '',
    component: StudentReportManagePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StudentReportManagePageRoutingModule {}
