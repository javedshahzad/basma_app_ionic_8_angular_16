import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AddParentPageRoutingModule } from './add-parent-routing.module';
import { AddParentPage } from './add-parent.page';
import { PipesModule } from '../pipes/pipes.module';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        AddParentPageRoutingModule,
        PipesModule,
        ReactiveFormsModule // 🟢 ReactiveForms لا زال مطلوباً لكود الـ Validation الخاص بك
        ,
        AddParentPage
    ],
})
export class AddParentPageModule {}