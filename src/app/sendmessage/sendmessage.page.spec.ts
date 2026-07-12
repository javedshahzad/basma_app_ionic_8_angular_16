import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { SendmessagePage } from './sendmessage.page';

describe('SendmessagePage', () => {
  let component: SendmessagePage;
  let fixture: ComponentFixture<SendmessagePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SendmessagePage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(SendmessagePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
