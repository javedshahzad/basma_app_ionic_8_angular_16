import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ConnectNewMessagePage } from './connect-new-message.page';

describe('ConnectNewMessagePage', () => {
  let component: ConnectNewMessagePage;
  let fixture: ComponentFixture<ConnectNewMessagePage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConnectNewMessagePage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ConnectNewMessagePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
