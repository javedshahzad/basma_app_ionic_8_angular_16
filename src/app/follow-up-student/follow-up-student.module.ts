import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FollowUpStudentPageRoutingModule } from './follow-up-student-routing.module';
import { FollowUpStudentPage } from './follow-up-student.page';
import { PipesModule } from '../pipes/pipes.module';

// 🟢 استيراد مكتبة الترجمة لحل مشكلة عدم ظهور الصفحة
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PipesModule,
    TranslateModule, // 🟢 تفعيل الترجمة هنا
    FollowUpStudentPageRoutingModule
  ],
  declarations: [FollowUpStudentPage]
})
export class FollowUpStudentPageModule {}