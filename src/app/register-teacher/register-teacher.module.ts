import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RegisterTeacherPageRoutingModule } from './register-teacher-routing.module';

import { RegisterTeacherPage } from './register-teacher.page';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RegisterTeacherPageRoutingModule,
    PipesModule
  ],
  declarations: [RegisterTeacherPage]
})
export class RegisterTeacherPageModule {}
