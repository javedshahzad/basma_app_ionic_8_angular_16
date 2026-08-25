import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { AppRate } from '@awesome-cordova-plugins/app-rate/ngx';
import { Storage as IonicStorage } from '@ionic/storage-angular';
import { of, NEVER } from 'rxjs';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';

import { EditTeacherProfilePage } from './edit-teacher-profile.page';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

describe('EditTeacherProfilePage', () => {
  let component: EditTeacherProfilePage;
  let fixture: ComponentFixture<EditTeacherProfilePage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), TranslateModule.forRoot(), RouterTestingModule, EditTeacherProfilePage],
      providers: [
        { provide: AppRate, useValue: {} },
        {
          provide: IonicStorage,
          useValue: {
            create: () =>
              Promise.resolve({
                get: () => Promise.resolve(null),
                set: () => Promise.resolve(),
                remove: () => Promise.resolve(),
                clear: () => Promise.resolve()
              })
          }
        },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditTeacherProfilePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  afterEach(() => {
    fixture.destroy();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
