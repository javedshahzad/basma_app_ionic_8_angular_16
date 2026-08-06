import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ContactUsPageRoutingModule } from './contact-us-routing.module';

import { ContactUsPage } from './contact-us.page';
import { PipesModule } from '../pipes/pipes.module';
import { TranslateModule } from '@ngx-translate/core'; // 🟢 إضافة هامة

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        ContactUsPageRoutingModule,
        PipesModule,
        TranslateModule // 🟢 استيراد الوحدة هنا
        ,
        ContactUsPage
    ]
})
export class ContactUsPageModule {}