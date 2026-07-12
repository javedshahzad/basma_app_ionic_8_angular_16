import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { TasksCalendarPage } from './tasks-calendar.page';

const routes: Routes = [
  {
    path: '',
    component: TasksCalendarPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TasksCalendarPageRoutingModule {}
