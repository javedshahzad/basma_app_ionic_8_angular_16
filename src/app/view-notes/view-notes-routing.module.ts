import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ViewNotesPage } from './view-notes.page';

const routes: Routes = [
  {
    path: '',
    component: ViewNotesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ViewNotesPageRoutingModule {}
