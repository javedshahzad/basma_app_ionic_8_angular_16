import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { MessagesPageRoutingModule } from './messages-routing.module';

import { MessagesPage } from './messages.page';
import { PipesModule } from '../pipes/pipes.module';




@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        MessagesPageRoutingModule,
        PipesModule,
        MessagesPage
    ]
})
export class MessagesPageModule {}
