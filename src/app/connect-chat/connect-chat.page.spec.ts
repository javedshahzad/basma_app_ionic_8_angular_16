import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ConnectChatPage } from './connect-chat.page';

describe('ConnectChatPage', () => {
  let component: ConnectChatPage;
  let fixture: ComponentFixture<ConnectChatPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConnectChatPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ConnectChatPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
