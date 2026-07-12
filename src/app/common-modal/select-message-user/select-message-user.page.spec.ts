import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { SelectMessageUserPage } from './select-message-user.page';

describe('SelectMessageUserPage', () => {
  let component: SelectMessageUserPage;
  let fixture: ComponentFixture<SelectMessageUserPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectMessageUserPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(SelectMessageUserPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
