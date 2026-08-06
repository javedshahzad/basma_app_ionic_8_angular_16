import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { SeminarListPageRoutingModule } from './seminar-list-routing.module';

import { SeminarListPage } from './seminar-list.page';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        SeminarListPageRoutingModule,
        PipesModule,
        SeminarListPage,
    ]
})
export class SeminarListPageModule {}
