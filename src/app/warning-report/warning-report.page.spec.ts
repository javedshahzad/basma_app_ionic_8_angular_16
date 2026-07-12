import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { WarningReportPage } from './warning-report.page';

describe('WarningReportPage', () => {
  let component: WarningReportPage;
  let fixture: ComponentFixture<WarningReportPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WarningReportPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(WarningReportPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
