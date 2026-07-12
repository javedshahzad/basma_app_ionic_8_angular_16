import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ConnectChatPageRoutingModule } from './connect-chat-routing.module';

import { ConnectChatPage } from './connect-chat.page';
import { PipesModule } from '../pipes/pipes.module';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ConnectChatPageRoutingModule,
    PipesModule
  ],
  declarations: [ConnectChatPage]
})
export class ConnectChatPageModule {}
