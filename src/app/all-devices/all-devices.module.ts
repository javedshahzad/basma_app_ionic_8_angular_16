import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AllDevicesPageRoutingModule } from './all-devices-routing.module';

import { AllDevicesPage } from './all-devices.page';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PipesModule,
    AllDevicesPageRoutingModule
  ],
  declarations: [AllDevicesPage]
})
export class AllDevicesPageModule {}
