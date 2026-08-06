import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScrollingModule } from '@angular/cdk/scrolling';

import { IonicModule } from '@ionic/angular';

import { StudentsPageRoutingModule } from './students-routing.module';

import { StudentsPage } from './students.page';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        ScrollingModule,
        StudentsPageRoutingModule,
        PipesModule,
        StudentsPage,
    ]
})
export class StudentsPageModule {}
