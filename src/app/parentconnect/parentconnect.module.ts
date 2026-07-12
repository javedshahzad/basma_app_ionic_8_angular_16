import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ParentconnectPageRoutingModule } from './parentconnect-routing.module';

import { ParentconnectPage } from './parentconnect.page';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ParentconnectPageRoutingModule,
    PipesModule
  ],
  declarations: [ParentconnectPage]
})
export class ParentconnectPageModule {}
