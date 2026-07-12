import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { PostNewsPage } from './post-news.page';

describe('PostNewsPage', () => {
  let component: PostNewsPage;
  let fixture: ComponentFixture<PostNewsPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PostNewsPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(PostNewsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
