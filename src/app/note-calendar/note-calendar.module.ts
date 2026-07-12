import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { NoteCalendarPageRoutingModule } from './note-calendar-routing.module';
import { NoteCalendarPage } from './note-calendar.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    NoteCalendarPageRoutingModule
  ],
  declarations: [NoteCalendarPage]
})
export class NoteCalendarPageModule {}