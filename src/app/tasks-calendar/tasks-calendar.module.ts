import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { TasksCalendarPageRoutingModule } from './tasks-calendar-routing.module';

import { TasksCalendarPage } from './tasks-calendar.page';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PipesModule,
    TasksCalendarPageRoutingModule
  ],
  declarations: [TasksCalendarPage]
})
export class TasksCalendarPageModule {}
