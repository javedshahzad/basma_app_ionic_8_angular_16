import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PrivateMessagePageRoutingModule } from './private-message-routing.module';

import { PrivateMessagePage } from './private-message.page'; 
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PrivateMessagePageRoutingModule,
    PipesModule
  ],
  declarations: [PrivateMessagePage]
})
export class PrivateMessagePageModule {}
