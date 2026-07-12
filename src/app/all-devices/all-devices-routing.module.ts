import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { AllDevicesPage } from './all-devices.page';

const routes: Routes = [
  {
    path: '',
    component: AllDevicesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AllDevicesPageRoutingModule {}
