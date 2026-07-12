import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { FollowUpStudentPage } from './follow-up-student.page';

describe('FollowUpStudentPage', () => {
  let component: FollowUpStudentPage;
  let fixture: ComponentFixture<FollowUpStudentPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FollowUpStudentPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(FollowUpStudentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
