import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';

import { AddNotesPage } from './add-notes.page';

describe('AddNotesPage', () => {
  let component: AddNotesPage;
  let fixture: ComponentFixture<AddNotesPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddNotesPage ],
      imports: [IonicModule.forRoot()]
    }).compileComponents();

    fixture = TestBed.createComponent(AddNotesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
