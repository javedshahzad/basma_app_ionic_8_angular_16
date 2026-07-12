import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AddParentPage } from './add-parent.page';

describe('AddParentPage', () => {
  let component: AddParentPage;
  let fixture: ComponentFixture<AddParentPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddParentPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(AddParentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
