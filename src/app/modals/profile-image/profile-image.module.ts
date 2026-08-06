import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ProfileImagePageRoutingModule } from './profile-image-routing.module';
import { ProfileImagePage } from './profile-image.page';
import { PinchZoomModule } from '@mtnair/ngx-pinch-zoom';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        ProfileImagePageRoutingModule,
        PinchZoomModule,
        ProfileImagePage
    ]
})
export class ProfileImagePageModule {}