import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ElearningSchoolsPage } from './elearning-schools.page';

describe('ElearningSchoolsPage', () => {
  let component: ElearningSchoolsPage;
  let fixture: ComponentFixture<ElearningSchoolsPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ElearningSchoolsPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ElearningSchoolsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
