import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EditStudentProfilePageRoutingModule } from './edit-student-profile-routing.module';

import { EditStudentProfilePage } from './edit-student-profile.page';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EditStudentProfilePageRoutingModule,
    PipesModule
  ],
  declarations: [EditStudentProfilePage]
})
export class EditStudentProfilePageModule {}
