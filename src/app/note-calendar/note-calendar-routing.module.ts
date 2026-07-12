import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { NoteCalendarPage } from './note-calendar.page';

const routes: Routes = [
  {
    path: '',
    component: NoteCalendarPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class NoteCalendarPageRoutingModule {}
