import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { StudentReportListPage } from './student-report-list.page';

describe('StudentReportListPage', () => {
  let component: StudentReportListPage;
  let fixture: ComponentFixture<StudentReportListPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ StudentReportListPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(StudentReportListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
