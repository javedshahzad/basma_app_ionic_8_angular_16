import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AllApplicationListPageRoutingModule } from './all-application-list-routing.module';

import { AllApplicationListPage } from './all-application-list.page';
import { IonicSelectableComponent } from 'ionic-selectable';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        AllApplicationListPageRoutingModule,
        PipesModule,
        IonicSelectableComponent,
        AllApplicationListPage,
    ],
    providers: [DatePipe]
})
export class AllApplicationListPageModule {}
