import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { StudentNotesPage } from './student-notes.page';

describe('StudentNotesPage', () => {
  let component: StudentNotesPage;
  let fixture: ComponentFixture<StudentNotesPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StudentNotesPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(StudentNotesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
