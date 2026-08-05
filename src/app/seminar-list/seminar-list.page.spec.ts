import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Network } from '@awesome-cordova-plugins/network/ngx';
import { Device } from '@awesome-cordova-plugins/device/ngx';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';
import { AppRate } from '@awesome-cordova-plugins/app-rate/ngx';
import { Printer } from '@awesome-cordova-plugins/printer/ngx';
import { Storage as IonicStorage } from '@ionic/storage-angular';
import { of, NEVER } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';
import { DummyRouteComponent } from '@app/testing/dummy-route.component';

import { SeminarListPage } from './seminar-list.page';

describe('SeminarListPage', () => {
  let component: SeminarListPage;
  let fixture: ComponentFixture<SeminarListPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SeminarListPage ],
      imports: [IonicModule.forRoot(), HttpClientTestingModule, TranslateModule.forRoot(), RouterTestingModule.withRoutes([{ path: 'login', component: DummyRouteComponent }])],
      providers: [
        { provide: Network, useValue: { onDisconnect: () => NEVER, onConnect: () => NEVER, type: 'wifi', Connection: { UNKNOWN: 'unknown', NONE: 'none' } } },
        { provide: Device, useValue: { uuid: 'test-uuid', platform: 'browser' } },
        { provide: SQLite, useValue: {} },
        { provide: AppRate, useValue: {} },
        { provide: Printer, useValue: { print: () => Promise.resolve() } },
        { provide: IonicStorage, useValue: { create: () => Promise.resolve({ get: () => Promise.resolve(null), set: () => Promise.resolve(), remove: () => Promise.resolve(), clear: () => Promise.resolve() }) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SeminarListPage);
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
