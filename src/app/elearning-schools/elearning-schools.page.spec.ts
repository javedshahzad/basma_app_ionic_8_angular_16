import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { AppRate } from '@awesome-cordova-plugins/app-rate/ngx';
import { GeoServiceProvider } from '../service/geo-service/geo-service';
import { Storage as IonicStorage } from '@ionic/storage-angular';
import { of, NEVER } from 'rxjs';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';

import { ElearningSchoolsPage } from './elearning-schools.page';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ElearningSchoolsPage', () => {
  let component: ElearningSchoolsPage;
  let fixture: ComponentFixture<ElearningSchoolsPage>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
    imports: [IonicModule.forRoot(), TranslateModule.forRoot(), RouterTestingModule, ElearningSchoolsPage],
    providers: [
        { provide: AppRate, useValue: {} },
        {
            provide: GeoServiceProvider,
            useValue: {
                getAllCountries: () => [],
                getEnCountries: () => [],
                getArCountries: () => [],
                get_country_name: () => '',
                getCountryName: () => '',
                getCountryDetails: () => ({}),
                getCountryPhone: () => '',
                getCountriesData: () => [],
                getMyLocation: () => Promise.resolve({})
            }
        },
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

    fixture = TestBed.createComponent(ElearningSchoolsPage);
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
