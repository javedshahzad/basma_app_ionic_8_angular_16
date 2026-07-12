import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { PostNewsPage } from './post-news.page';

const routes: Routes = [
  {
    path: '',
    component: PostNewsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PostNewsPageRoutingModule {}
