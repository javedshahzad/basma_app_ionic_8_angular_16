import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { RateAppComponent } from './rate-app.component';

describe('RateAppComponent', () => {
  let component: RateAppComponent;
  let fixture: ComponentFixture<RateAppComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RateAppComponent ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(RateAppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
