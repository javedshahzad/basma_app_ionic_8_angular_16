import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ViewBulletinPage } from './view-bulletin.page';

describe('ViewBulletinPage', () => {
  let component: ViewBulletinPage;
  let fixture: ComponentFixture<ViewBulletinPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewBulletinPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ViewBulletinPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
