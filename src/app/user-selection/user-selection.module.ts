import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { UserSelectionPageRoutingModule } from './user-selection-routing.module';

import { UserSelectionPage } from './user-selection.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    UserSelectionPageRoutingModule
  ],
  declarations: [UserSelectionPage]
})
export class UserSelectionPageModule {}
