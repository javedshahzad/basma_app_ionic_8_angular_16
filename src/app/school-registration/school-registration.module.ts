import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SchoolRegistrationPageRoutingModule } from './school-registration-routing.module';
import { SchoolRegistrationPage } from './school-registration.page';
import { PipesModule } from '../pipes/pipes.module';
import { IonicSelectableComponent } from 'ionic-selectable';
// 🟢 إضافة مكتبة الترجمة
import { TranslateModule } from '@ngx-translate/core'; 

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        SchoolRegistrationPageRoutingModule,
        PipesModule,
        IonicSelectableComponent,
        TranslateModule // 🟢 تفعيل الترجمة في الصفحة
        ,
        SchoolRegistrationPage
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    providers: [IonicSelectableComponent]
})
export class SchoolRegistrationPageModule {}