import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ChildrenPageRoutingModule } from './children-routing.module';

import { ChildrenPage } from './children.page';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    PipesModule,
    IonicModule,
    ChildrenPageRoutingModule
  ],
  declarations: [ChildrenPage]
})
export class ChildrenPageModule {}
