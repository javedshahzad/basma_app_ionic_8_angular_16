import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ShareBulletinsPage } from './share-bulletins.page';

describe('ShareBulletinsPage', () => {
  let component: ShareBulletinsPage;
  let fixture: ComponentFixture<ShareBulletinsPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ShareBulletinsPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ShareBulletinsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
