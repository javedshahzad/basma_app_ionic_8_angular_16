import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { NoteCalendarPage } from './note-calendar.page';

describe('NoteCalendarPage', () => {
  let component: NoteCalendarPage;
  let fixture: ComponentFixture<NoteCalendarPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NoteCalendarPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(NoteCalendarPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
