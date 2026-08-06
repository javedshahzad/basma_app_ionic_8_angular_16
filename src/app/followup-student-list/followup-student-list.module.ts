import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FollowupStudentListPageRoutingModule } from './followup-student-list-routing.module';

import { FollowupStudentListPage } from './followup-student-list.page';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        PipesModule,
        FollowupStudentListPageRoutingModule,
        FollowupStudentListPage,
    ]
})
export class FollowupStudentListPageModule {}
