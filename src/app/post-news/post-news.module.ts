import { CUSTOM_ELEMENTS_SCHEMA,NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PostNewsPageRoutingModule } from './post-news-routing.module';

import { PostNewsPage } from './post-news.page';
import { PipesModule } from '../pipes/pipes.module';

import { IonicSelectableComponent } from 'ionic-selectable';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        PipesModule,
        PostNewsPageRoutingModule,
        IonicSelectableComponent,
        PostNewsPage
    ],
    providers: [IonicSelectableComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PostNewsPageModule {}
