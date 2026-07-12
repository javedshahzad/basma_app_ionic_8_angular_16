import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { ViewNotesPage } from './view-notes.page';

describe('ViewNotesPage', () => {
  let component: ViewNotesPage;
  let fixture: ComponentFixture<ViewNotesPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ViewNotesPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(ViewNotesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
