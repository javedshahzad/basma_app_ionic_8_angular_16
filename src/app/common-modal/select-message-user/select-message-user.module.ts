import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SelectMessageUserPageRoutingModule } from './select-message-user-routing.module';

import { SelectMessageUserPage } from './select-message-user.page';
import { PipesModule } from '../../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SelectMessageUserPageRoutingModule,
    PipesModule
  ],
  declarations: [SelectMessageUserPage]
})
export class SelectMessageUserPageModule {}
