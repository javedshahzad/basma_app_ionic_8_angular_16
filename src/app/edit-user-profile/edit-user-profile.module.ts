import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EditUserProfilePageRoutingModule } from './edit-user-profile-routing.module';

import { EditUserProfilePage } from './edit-user-profile.page';
import { PipesModule } from '../pipes/pipes.module';
import { IonicSelectableComponent } from 'ionic-selectable';

@NgModule({
    imports: [
        CommonModule,
        PipesModule,
        FormsModule,
        IonicModule,
        EditUserProfilePageRoutingModule,
        IonicSelectableComponent,
        EditUserProfilePage
    ]
})
export class EditUserProfilePageModule {}
