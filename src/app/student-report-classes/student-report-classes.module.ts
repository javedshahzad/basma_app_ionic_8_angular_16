import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StudentReportClassesPageRoutingModule } from './student-report-classes-routing.module';

import { StudentReportClassesPage } from './student-report-classes.page';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PipesModule,
    StudentReportClassesPageRoutingModule
  ],
  declarations: [StudentReportClassesPage]
})
export class StudentReportClassesPageModule {}
