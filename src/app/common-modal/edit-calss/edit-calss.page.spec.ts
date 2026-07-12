import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { EditCalssPage } from './edit-calss.page';

describe('EditCalssPage', () => {
  let component: EditCalssPage;
  let fixture: ComponentFixture<EditCalssPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditCalssPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(EditCalssPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
