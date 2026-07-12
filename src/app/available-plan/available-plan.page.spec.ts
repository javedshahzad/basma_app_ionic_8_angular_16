import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AvailablePlanPage } from './available-plan.page';

describe('AvailablePlanPage', () => {
  let component: AvailablePlanPage;
  let fixture: ComponentFixture<AvailablePlanPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AvailablePlanPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(AvailablePlanPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
