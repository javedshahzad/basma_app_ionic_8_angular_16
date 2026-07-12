import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { StudentReportManagePage } from './student-report-manage.page';

describe('StudentReportManagePage', () => {
  let component: StudentReportManagePage;
  let fixture: ComponentFixture<StudentReportManagePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StudentReportManagePage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(StudentReportManagePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
