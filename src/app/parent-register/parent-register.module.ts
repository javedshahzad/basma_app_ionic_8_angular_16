import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ParentRegisterPageRoutingModule } from './parent-register-routing.module';

import { ParentRegisterPage } from './parent-register.page';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    PipesModule,
    IonicModule,
    ParentRegisterPageRoutingModule
  ],
  declarations: [ParentRegisterPage]
})
export class ParentRegisterPageModule {}
