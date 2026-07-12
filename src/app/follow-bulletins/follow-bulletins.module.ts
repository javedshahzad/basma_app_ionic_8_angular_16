import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { IonicModule } from '@ionic/angular';

import { FollowBulletinsPageRoutingModule } from './follow-bulletins-routing.module';

import { FollowBulletinsPage } from './follow-bulletins.page';
import { PipesModule } from '../pipes/pipes.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    FollowBulletinsPageRoutingModule,
    PipesModule
  ],
  declarations: [FollowBulletinsPage]
})
export class FollowBulletinsPageModule {}
