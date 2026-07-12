import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core'; 

import { DateFormatPipe } from './date-format/date-format.pipe';
import { SafePipe } from './safe/safe.pipe';
import { UserSearchPipe } from './user-search.pipe';
import { LinkyPipe } from './linky.pipe';

@NgModule({
  declarations: [
    DateFormatPipe,
    SafePipe,
    UserSearchPipe,
    LinkyPipe
  ],
  imports: [
    CommonModule,
    TranslateModule.forChild() 
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