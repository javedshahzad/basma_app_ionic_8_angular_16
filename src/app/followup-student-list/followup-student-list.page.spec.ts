import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { FollowupStudentListPage } from './followup-student-list.page';

describe('FollowupStudentListPage', () => {
  let component: FollowupStudentListPage;
  let fixture: ComponentFixture<FollowupStudentListPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FollowupStudentListPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(FollowupStudentListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
