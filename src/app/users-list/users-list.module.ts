import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { UsersListPageRoutingModule } from './users-list-routing.module';
import { UsersListPage } from './users-list.page';
import { PipesModule } from '../pipes/pipes.module';


@NgModule({
    imports: [
        CommonModule,
        PipesModule,
        FormsModule,
        IonicModule,
        UsersListPageRoutingModule,
        UsersListPage
    ]
})
export class UsersListPageModule {}
