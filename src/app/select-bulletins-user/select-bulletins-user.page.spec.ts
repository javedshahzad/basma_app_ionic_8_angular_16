import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { SelectBulletinsUserPage } from './select-bulletins-user.page';

describe('SelectBulletinsUserPage', () => {
  let component: SelectBulletinsUserPage;
  let fixture: ComponentFixture<SelectBulletinsUserPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SelectBulletinsUserPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(SelectBulletinsUserPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
