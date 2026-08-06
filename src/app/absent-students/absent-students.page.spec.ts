import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { AppRate } from '@awesome-cordova-plugins/app-rate/ngx';
import { DatePipe } from '@angular/common';
import { Storage as IonicStorage } from '@ionic/storage-angular';
import { of, NEVER } from 'rxjs';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';
import { DummyRouteComponent } from '@app/testing/dummy-route.component';

import { AbsentStudentsPage } from './absent-students.page';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('AbsentStudentsPage', () => {
  let component: AbsentStudentsPage;
  let fixture: ComponentFixture<AbsentStudentsPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [
        IonicModule.forRoot(),
        TranslateModule.forRoot(),
        RouterTestingModule.withRoutes([{ path: 'login', component: DummyRouteComponent }]),
        AbsentStudentsPage
    ],
    providers: [
        { provide: AppRate, useValue: {} },
        DatePipe,
        {
            provide: IonicStorage,
            useValue: {
                create: () => Promise.resolve({
                    get: () => Promise.resolve(null),
                    set: () => Promise.resolve(),
                    remove: () => Promise.resolve(),
                    clear: () => Promise.resolve()
                })
            }
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
}).compileComponents();

    fixture = TestBed.createComponent(AbsentStudentsPage);
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
