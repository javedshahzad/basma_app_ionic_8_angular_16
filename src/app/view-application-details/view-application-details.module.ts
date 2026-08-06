import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ViewApplicationDetailsPageRoutingModule } from './view-application-details-routing.module';

import { ViewApplicationDetailsPage } from './view-application-details.page';
import { PipesModule } from '../pipes/pipes.module';
import { IonicSelectableComponent } from 'ionic-selectable';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        ViewApplicationDetailsPageRoutingModule,
        PipesModule,
        IonicSelectableComponent,
        ViewApplicationDetailsPage,
    ]
})
export class ViewApplicationDetailsPageModule {}
