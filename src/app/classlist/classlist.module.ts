import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ClasslistPageRoutingModule } from './classlist-routing.module';
import { ClasslistPage } from './classlist.page';
import { PipesModule } from '../pipes/pipes.module';

// 🟢 1. استيراد المكونات الجديدة
import { ClasslistOptionsPopoverComponent } from '../components/classlist-options-popover/classlist-options-popover.component';
import { EditClassModalComponent } from '../components/edit-class-modal/edit-class-modal.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        ClasslistPageRoutingModule,
        PipesModule,
        ClasslistPage,
        ClasslistOptionsPopoverComponent,
        EditClassModalComponent
    ]
})
export class ClasslistPageModule {}