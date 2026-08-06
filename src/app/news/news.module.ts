import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { NewsPageRoutingModule } from './news-routing.module';
import { NewsPage } from './news.page';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        PipesModule,
        NewsPageRoutingModule,
        NewsPage
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class NewsPageModule {}