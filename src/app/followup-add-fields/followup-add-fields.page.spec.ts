import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { FollowupAddFieldsPage } from './followup-add-fields.page';

describe('FollowupAddFieldsPage', () => {
  let component: FollowupAddFieldsPage;
  let fixture: ComponentFixture<FollowupAddFieldsPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FollowupAddFieldsPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(FollowupAddFieldsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
