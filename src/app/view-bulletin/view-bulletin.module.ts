import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ViewBulletinPageRoutingModule } from './view-bulletin-routing.module';

import { ViewBulletinPage } from './view-bulletin.page';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ViewBulletinPageRoutingModule,
    PipesModule
  ],
  declarations: [ViewBulletinPage]
})
export class ViewBulletinPageModule {}
