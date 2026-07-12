import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { DelaylistPage } from './delaylist.page';

describe('DelaylistPage', () => {
  let component: DelaylistPage;
  let fixture: ComponentFixture<DelaylistPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DelaylistPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(DelaylistPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
