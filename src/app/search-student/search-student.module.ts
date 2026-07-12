import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SearchStudentPageRoutingModule } from './search-student-routing.module';

import { SearchStudentPage } from './search-student.page';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SearchStudentPageRoutingModule,
    PipesModule
  ],
  declarations: [SearchStudentPage]
})
export class SearchStudentPageModule {}
