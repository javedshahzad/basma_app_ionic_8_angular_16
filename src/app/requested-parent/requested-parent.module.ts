import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RequestedParentPageRoutingModule } from './requested-parent-routing.module';

import { RequestedParentPage } from './requested-parent.page';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PipesModule,
    RequestedParentPageRoutingModule
  ],
  declarations: [RequestedParentPage]
})
export class RequestedParentPageModule {}
