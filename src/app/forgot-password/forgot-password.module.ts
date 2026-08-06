import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ForgotPasswordPageRoutingModule } from './forgot-password-routing.module';
import { ForgotPasswordPage } from './forgot-password.page';
import { PipesModule } from '../pipes/pipes.module';

// 🟢 استيراد مكتبة الترجمة الضرورية
import { TranslateModule } from '@ngx-translate/core'; 

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        PipesModule,
        TranslateModule, // 🟢 تفعيل الترجمة في الصفحة
        ForgotPasswordPageRoutingModule,
        ForgotPasswordPage
    ]
})
export class ForgotPasswordPageModule {}