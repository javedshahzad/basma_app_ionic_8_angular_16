import { CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ListStudentPageRoutingModule } from './list-student-routing.module';

import { ListStudentPage } from './list-student.page';
import { PipesModule } from '../pipes/pipes.module';

import { TeacherViewComponent } from '../components/teacher-view/teacher-view.component';
import { SupervisorViewComponent } from '../components/supervisor-view/supervisor-view.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        ListStudentPageRoutingModule,
        PipesModule,
        ListStudentPage,
        TeacherViewComponent,
        SupervisorViewComponent,
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class ListStudentPageModule {}
