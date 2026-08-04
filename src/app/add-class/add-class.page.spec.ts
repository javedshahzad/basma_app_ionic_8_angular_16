import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Network } from '@awesome-cordova-plugins/network/ngx';
import { Device } from '@awesome-cordova-plugins/device/ngx';
import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';
import { AppRate } from '@awesome-cordova-plugins/app-rate/ngx';
import { Storage as IonicStorage } from '@ionic/storage-angular';
import { of, NEVER } from 'rxjs';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';

import { AddClassPage } from './add-class.page';

describe('AddClassPage', () => {
  let component: AddClassPage;
  let fixture: ComponentFixture<AddClassPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddClassPage ],
      imports: [IonicModule.forRoot(), HttpClientTestingModule, TranslateModule.forRoot(), RouterTestingModule],
      providers: [
        { provide: Network, useValue: { onDisconnect: () => NEVER, onConnect: () => NEVER, type: 'wifi', Connection: { UNKNOWN: 'unknown', NONE: 'none' } } },
        { provide: Device, useValue: { uuid: 'test-uuid', platform: 'browser' } },
        { provide: SQLite, useValue: {} },
        { provide: AppRate, useValue: {} },
        { provide: IonicStorage, useValue: { create: () => Promise.resolve({ get: () => Promise.resolve(null), set: () => Promise.resolve(), remove: () => Promise.resolve(), clear: () => Promise.resolve() }) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddClassPage);
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
