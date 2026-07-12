import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AddClassPage } from './add-class.page';

describe('AddClassPage', () => {
  let component: AddClassPage;
  let fixture: ComponentFixture<AddClassPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddClassPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(AddClassPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
