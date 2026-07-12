import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { StudentNotesPageRoutingModule } from './student-notes-routing.module';

import { StudentNotesPage } from './student-notes.page'; 
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    StudentNotesPageRoutingModule,
    PipesModule
  ],
  declarations: [StudentNotesPage]
})
export class StudentNotesPageModule {}
