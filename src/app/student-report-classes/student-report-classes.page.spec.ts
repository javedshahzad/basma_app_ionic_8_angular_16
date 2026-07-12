import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { StudentReportClassesPage } from './student-report-classes.page';

describe('StudentReportClassesPage', () => {
  let component: StudentReportClassesPage;
  let fixture: ComponentFixture<StudentReportClassesPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StudentReportClassesPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(StudentReportClassesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
