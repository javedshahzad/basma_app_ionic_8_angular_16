import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { RequestedParentPage } from './requested-parent.page';

describe('RequestedParentPage', () => {
  let component: RequestedParentPage;
  let fixture: ComponentFixture<RequestedParentPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RequestedParentPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(RequestedParentPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
