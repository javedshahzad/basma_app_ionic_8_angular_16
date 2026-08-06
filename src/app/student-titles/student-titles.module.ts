import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { StudentTitlesPageRoutingModule } from './student-titles-routing.module';
import { StudentTitlesPage } from './student-titles.page';

// 🟢 1. قمنا باستيراد مكتبة الترجمة هنا
import { TranslateModule } from '@ngx-translate/core'; 

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        StudentTitlesPageRoutingModule,
        TranslateModule // 🟢 2. قمنا بإضافتها هنا ليتعرف عليها ملف الـ HTML
        ,
        StudentTitlesPage
    ]
})
export class StudentTitlesPageModule {}