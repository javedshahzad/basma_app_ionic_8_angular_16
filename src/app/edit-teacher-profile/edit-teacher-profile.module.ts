import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EditTeacherProfilePageRoutingModule } from './edit-teacher-profile-routing.module';

import { EditTeacherProfilePage } from './edit-teacher-profile.page';
import { IonicSelectableComponent } from 'ionic-selectable';

import { PipesModule } from '../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EditTeacherProfilePageRoutingModule,
    IonicSelectableComponent,
    PipesModule
  ],
  declarations: [EditTeacherProfilePage]
})
export class EditTeacherProfilePageModule {}
