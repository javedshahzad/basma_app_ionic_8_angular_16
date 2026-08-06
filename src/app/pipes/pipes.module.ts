import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core'; 

import { DateFormatPipe } from './date-format/date-format.pipe';
import { SafePipe } from './safe/safe.pipe';
import { UserSearchPipe } from './user-search.pipe';
import { LinkyPipe } from './linky.pipe';

@NgModule({
    imports: [
        CommonModule,
        TranslateModule.forChild(),
        DateFormatPipe,
        SafePipe,
        UserSearchPipe,
        LinkyPipe
    ],
    exports: [
        DateFormatPipe,
        SafePipe,
        UserSearchPipe,
        LinkyPipe,
        TranslateModule
    ]
})
export class PipesModule {}