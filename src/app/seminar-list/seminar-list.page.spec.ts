import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { SeminarListPage } from './seminar-list.page';

describe('SeminarListPage', () => {
  let component: SeminarListPage;
  let fixture: ComponentFixture<SeminarListPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SeminarListPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(SeminarListPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
