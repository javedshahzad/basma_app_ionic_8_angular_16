import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { TasksCalendarPage } from './tasks-calendar.page';

describe('TasksCalendarPage', () => {
  let component: TasksCalendarPage;
  let fixture: ComponentFixture<TasksCalendarPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TasksCalendarPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(TasksCalendarPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
