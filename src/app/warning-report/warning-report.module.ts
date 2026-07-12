import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { WarningReportPageRoutingModule } from './warning-report-routing.module';

import { WarningReportPage } from './warning-report.page';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    WarningReportPageRoutingModule,
    PipesModule
  ],
  declarations: [WarningReportPage]
})
export class WarningReportPageModule {}
