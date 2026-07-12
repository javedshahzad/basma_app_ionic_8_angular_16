import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { PlayvideoPage } from './playvideo.page';

describe('PlayvideoPage', () => {
  let component: PlayvideoPage;
  let fixture: ComponentFixture<PlayvideoPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PlayvideoPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(PlayvideoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
