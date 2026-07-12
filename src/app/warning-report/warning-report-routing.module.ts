import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { WarningReportPage } from './warning-report.page';

const routes: Routes = [
  {
    path: '',
    component: WarningReportPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class WarningReportPageRoutingModule {}
