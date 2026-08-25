import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { AppRate } from '@awesome-cordova-plugins/app-rate/ngx';
import { GeoServiceProvider } from '../service/geo-service/geo-service';
import { Storage as IonicStorage } from '@ionic/storage-angular';
import { of, NEVER } from 'rxjs';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';

import { ElearningSchoolVideoPage } from './elearning-school-video.page';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

describe('ElearningSchoolVideoPage', () => {
  let component: ElearningSchoolVideoPage;
  let fixture: ComponentFixture<ElearningSchoolVideoPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), TranslateModule.forRoot(), RouterTestingModule, ElearningSchoolVideoPage],
      providers: [
        { provide: AppRate, useValue: {} },
        {
          provide: GeoServiceProvider,
          useValue: {
            getAllCountries: (): any[] => [],
            getEnCountries: (): any[] => [],
            getArCountries: (): any[] => [],
            get_country_name: () => '',
            getCountryName: () => '',
            getCountryDetails: () => ({}),
            getCountryPhone: () => '',
            getCountriesData: (): any[] => [],
            getMyLocation: () => Promise.resolve({})
          }
        },
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

    fixture = TestBed.createComponent(ElearningSchoolVideoPage);
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
