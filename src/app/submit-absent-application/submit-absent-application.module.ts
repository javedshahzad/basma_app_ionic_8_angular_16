import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SubmitAbsentApplicationPageRoutingModule } from './submit-absent-application-routing.module';

import { SubmitAbsentApplicationPage } from './submit-absent-application.page';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SubmitAbsentApplicationPageRoutingModule,
    PipesModule,
  ],
  declarations: [SubmitAbsentApplicationPage]
})
export class SubmitAbsentApplicationPageModule {}
