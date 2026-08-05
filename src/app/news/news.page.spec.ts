import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Network } from '@awesome-cordova-plugins/network/ngx';
import { Device } from '@awesome-cordova-plugins/device/ngx';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';
import { AppRate } from '@awesome-cordova-plugins/app-rate/ngx';
import { GeoServiceProvider } from '../service/geo-service/geo-service';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { ScreenOrientation } from '@awesome-cordova-plugins/screen-orientation/ngx';
import { Storage as IonicStorage } from '@ionic/storage-angular';
import { of, NEVER } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';
import { DummyRouteComponent } from '@app/testing/dummy-route.component';

import { NewsPage } from './news.page';

describe('NewsPage', () => {
  let component: NewsPage;
  let fixture: ComponentFixture<NewsPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NewsPage ],
      imports: [IonicModule.forRoot(), HttpClientTestingModule, TranslateModule.forRoot(), RouterTestingModule.withRoutes([{ path: 'login', component: DummyRouteComponent }])],
      providers: [
        { provide: Network, useValue: { onDisconnect: () => NEVER, onConnect: () => NEVER, type: 'wifi', Connection: { UNKNOWN: 'unknown', NONE: 'none' } } },
        { provide: Device, useValue: { uuid: 'test-uuid', platform: 'browser' } },
        { provide: SQLite, useValue: {} },
        { provide: AppRate, useValue: {} },
        { provide: GeoServiceProvider, useValue: { getAllCountries: () => [], getEnCountries: () => [], getArCountries: () => [], get_country_name: () => '', getCountryName: () => '', getCountryDetails: () => ({}), getCountryPhone: () => '', getCountriesData: () => [], getMyLocation: () => Promise.resolve({}) } },
        { provide: SocialSharing, useValue: {} },
        { provide: ScreenOrientation, useValue: { lock: () => Promise.resolve(), unlock: () => {}, ORIENTATIONS: { PORTRAIT: 'portrait' } } },
        { provide: IonicStorage, useValue: { create: () => Promise.resolve({ get: () => Promise.resolve(null), set: () => Promise.resolve(), remove: () => Promise.resolve(), clear: () => Promise.resolve() }) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(NewsPage);
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
