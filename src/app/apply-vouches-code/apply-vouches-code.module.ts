import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ApplyVouchesCodePageRoutingModule } from './apply-vouches-code-routing.module';

import { ApplyVouchesCodePage } from './apply-vouches-code.page';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        ApplyVouchesCodePageRoutingModule,
        ApplyVouchesCodePage
    ]
})
export class ApplyVouchesCodePageModule {}
