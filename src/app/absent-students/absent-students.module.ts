import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AbsentStudentsPageRoutingModule } from './absent-students-routing.module';

import { AbsentStudentsPage } from './absent-students.page';
import { PipesModule } from '../pipes/pipes.module';
import { IonicSelectableComponent } from 'ionic-selectable';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        PipesModule,
        IonicSelectableComponent,
        AbsentStudentsPageRoutingModule,
        AbsentStudentsPage,
    ],
    providers: [DatePipe]
})
export class AbsentStudentsPageModule {}
