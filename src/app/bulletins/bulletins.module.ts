import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { BulletinsPageRoutingModule } from './bulletins-routing.module';
import { BulletinsPage } from './bulletins.page';
import { PipesModule } from '../pipes/pipes.module';
import { TranslateModule } from '@ngx-translate/core'; // 🟢 استيراد هام للترجمة

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    BulletinsPageRoutingModule,
    PipesModule,
    TranslateModule // 🟢 إضافته هنا
  ],
  declarations: [BulletinsPage],
  providers: []
})
export class BulletinsPageModule {}