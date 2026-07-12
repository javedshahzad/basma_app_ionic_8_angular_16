import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ConnectNewMessagePageRoutingModule } from './connect-new-message-routing.module';

import { ConnectNewMessagePage } from './connect-new-message.page';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ConnectNewMessagePageRoutingModule,
    PipesModule
  ],
  declarations: [ConnectNewMessagePage]
})
export class ConnectNewMessagePageModule {}
