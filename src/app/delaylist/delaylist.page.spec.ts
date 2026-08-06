import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { AppRate } from '@awesome-cordova-plugins/app-rate/ngx';
import { Storage as IonicStorage } from '@ionic/storage-angular';
import { of, NEVER } from 'rxjs';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';
import { DummyRouteComponent } from '@app/testing/dummy-route.component';

import { DelaylistPage } from './delaylist.page';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('DelaylistPage', () => {
  let component: DelaylistPage;
  let fixture: ComponentFixture<DelaylistPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [
        IonicModule.forRoot(),
        TranslateModule.forRoot(),
        RouterTestingModule.withRoutes([{ path: 'login', component: DummyRouteComponent }]),
        DelaylistPage
    ],
    providers: [
        { provide: AppRate, useValue: {} },
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

    fixture = TestBed.createComponent(DelaylistPage);
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
