import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DelaylistPageRoutingModule } from './delaylist-routing.module';

import { DelaylistPage } from './delaylist.page';

import { PipesModule } from '../pipes/pipes.module';
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DelaylistPageRoutingModule,
    PipesModule
  ],
  declarations: [DelaylistPage]
})
export class DelaylistPageModule {}
