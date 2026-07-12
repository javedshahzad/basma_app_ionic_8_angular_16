import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ViewClassNotesPage } from './view-class-notes.page';

describe('ViewClassNotesPage', () => {
  let component: ViewClassNotesPage;
  let fixture: ComponentFixture<ViewClassNotesPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewClassNotesPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ViewClassNotesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
