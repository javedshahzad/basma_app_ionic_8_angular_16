import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ViewClassNotesPage } from './view-class-notes.page';

const routes: Routes = [
  {
    path: 'view-class-notes',
    component: ViewClassNotesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ViewClassNotesPageRoutingModule {}
