import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StudentReportManagePageRoutingModule } from './student-report-manage-routing.module';

import { StudentReportManagePage } from './student-report-manage.page';
import { PipesModule } from '../pipes/pipes.module';
import { IonicSelectableComponent } from 'ionic-selectable';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PipesModule,
    StudentReportManagePageRoutingModule,
    IonicSelectableComponent
  ],
  declarations: [StudentReportManagePage]
})
export class StudentReportManagePageModule {}
