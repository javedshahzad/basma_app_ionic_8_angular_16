import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ManageStudentPageRoutingModule } from './manage-student-routing.module';

import { ManageStudentPage } from './manage-student.page';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ManageStudentPageRoutingModule,
    PipesModule
  ],
  declarations: [ManageStudentPage]
})
export class ManageStudentPageModule {}
