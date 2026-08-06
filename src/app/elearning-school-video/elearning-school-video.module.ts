import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ElearningSchoolVideoPageRoutingModule } from './elearning-school-video-routing.module';

import { ElearningSchoolVideoPage } from './elearning-school-video.page';
import { PipesModule } from '../pipes/pipes.module';
import { IonicSelectableComponent } from 'ionic-selectable';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        ElearningSchoolVideoPageRoutingModule,
        IonicSelectableComponent,
        PipesModule,
        ElearningSchoolVideoPage
    ]
})
export class ElearningSchoolVideoPageModule {}
