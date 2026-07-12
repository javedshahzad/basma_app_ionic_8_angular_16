import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ElearningSchoolsPageRoutingModule } from './elearning-schools-routing.module';

import { ElearningSchoolsPage } from './elearning-schools.page';
import { PipesModule } from '../pipes/pipes.module';

// 🟢 استيراد مكتبة الترجمة
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ElearningSchoolsPageRoutingModule,
    PipesModule,
    TranslateModule
  ],
  declarations: [ElearningSchoolsPage]
})
export class ElearningSchoolsPageModule {}