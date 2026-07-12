import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PlayvideoPage } from './playvideo.page';

const routes: Routes = [
  {
    path: '',
    component: PlayvideoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PlayvideoPageRoutingModule {}
