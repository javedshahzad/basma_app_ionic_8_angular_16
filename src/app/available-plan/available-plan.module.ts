import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { AvailablePlanPageRoutingModule } from './available-plan-routing.module';

import { AvailablePlanPage } from './available-plan.page';
import { PipesModule } from '../pipes/pipes.module';
import { SubscriptionService } from '../service/subscription/subscription.service';


@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        IonicModule,
        AvailablePlanPageRoutingModule,
        PipesModule,
        AvailablePlanPage
    ],
    providers: [SubscriptionService]
})
export class AvailablePlanPageModule {}
