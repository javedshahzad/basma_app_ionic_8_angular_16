import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ManageStudentPage } from './manage-student.page';

describe('ManageStudentPage', () => {
  let component: ManageStudentPage;
  let fixture: ComponentFixture<ManageStudentPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ManageStudentPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ManageStudentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
