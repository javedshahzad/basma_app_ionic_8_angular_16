import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StudentReportListPageRoutingModule } from './student-report-list-routing.module';

import { StudentReportListPage } from './student-report-list.page';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    PipesModule,
    IonicModule,
    StudentReportListPageRoutingModule,
  ],
  declarations: [StudentReportListPage]
})
export class StudentReportListPageModule {}
