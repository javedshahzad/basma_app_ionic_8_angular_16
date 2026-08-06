import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { AppRate } from '@awesome-cordova-plugins/app-rate/ngx';
import { Storage as IonicStorage } from '@ionic/storage-angular';
import { of, NEVER } from 'rxjs';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';

import { ViewApplicationDetailsPage } from './view-application-details.page';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ViewApplicationDetailsPage', () => {
  let component: ViewApplicationDetailsPage;
  let fixture: ComponentFixture<ViewApplicationDetailsPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [IonicModule.forRoot(), TranslateModule.forRoot(), RouterTestingModule, ViewApplicationDetailsPage],
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

    fixture = TestBed.createComponent(ViewApplicationDetailsPage);
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
