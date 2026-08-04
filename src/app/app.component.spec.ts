import { CUSTOM_ELEMENTS_SCHEMA, NgZone } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject } from 'rxjs';

import { Platform, MenuController, NavController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Storage as IonicStorage } from '@ionic/storage-angular';
import { HttpClient } from '@angular/common/http';
import { Device } from '@awesome-cordova-plugins/device/ngx';
import { Network } from '@awesome-cordova-plugins/network/ngx';
import { ScreenOrientation } from '@awesome-cordova-plugins/screen-orientation/ngx';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';

import { AppComponent } from './app.component';
import { AuthService } from './service/auth/auth.service';
import { DataService } from './service/data/data.service';
import { DatabaseService } from './service/database/database.service';
import { StorageService } from './service/storage.service';
import { FcmService } from './service/fcm.service';
import { SyncService } from './service/sync/sync.service';
import { DeviceApiService } from './service/device-api/device-api.service';
import { PlanApiService } from './service/plan-api/plan-api.service';

// هذا الملف كان يختبر تطبيق "Inbox/Outbox" التجريبي الأصلي من قالب Ionic CLI
// (menu items وهمية، مسارات /folder/Inbox غير موجودة أصلاً في Basma)، ويستورد
// حزم @awesome-cordova-plugins/splash-screen و status-bar التي لم تعد مثبتة
// بعد الانتقال لإضافات Capacitor الأصلية — ما كان يمنع كامل حزمة الاختبارات
// (115 ملف spec) من التصريف. استُبدل باختبار حقيقي للمكوّن الفعلي.
describe('AppComponent', () => {
  let storageSrSpy: any;
  let translateSpy: any;
  let authEvent: Subject<any>;
  let fcmGetPlan: Subject<any>;
  let dataProviderSpy: any;

  beforeEach(waitForAsync(() => {
    authEvent = new Subject();
    fcmGetPlan = new Subject();

    storageSrSpy = jasmine.createSpyObj('StorageService', ['init', 'get', 'set', 'remove']);
    storageSrSpy.get.and.returnValue(Promise.resolve(null));
    storageSrSpy.set.and.returnValue(Promise.resolve());
    storageSrSpy.remove.and.returnValue(Promise.resolve());

    translateSpy = jasmine.createSpyObj('TranslateService', ['setDefaultLang', 'use', 'get']);
    translateSpy.use.and.returnValue(of('ar'));
    translateSpy.get.and.returnValue(
      of({ sidemenu: { login: 'Login', news: 'News' }, alertmessages: {}, app_rate: {}, switch_account: 'Switch' })
    );

    dataProviderSpy = jasmine.createSpyObj('DataService', ['hideLoading', 'run']);
    dataProviderSpy.language = new Subject();
    dataProviderSpy.run.and.callFake((fn: any) => fn());

    TestBed.configureTestingModule({
      declarations: [AppComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      imports: [RouterTestingModule.withRoutes([])],
      providers: [
        { provide: Platform, useValue: jasmine.createSpyObj('Platform', { ready: Promise.resolve(), is: false }) },
        { provide: StorageService, useValue: storageSrSpy },
        { provide: TranslateService, useValue: translateSpy },
        { provide: AuthService, useValue: { event: authEvent } },
        { provide: ScreenOrientation, useValue: {} },
        { provide: DataService, useValue: dataProviderSpy },
        { provide: DatabaseService, useValue: jasmine.createSpyObj('DatabaseService', {
            openDataBase: Promise.resolve(),
            createTable: undefined
          }) },
        { provide: Network, useValue: {} },
        { provide: NgZone, useValue: { run: (fn: any) => fn() } },
        { provide: IonicStorage, useValue: { create: () => Promise.resolve({ get: () => Promise.resolve(null), set: () => Promise.resolve(), remove: () => Promise.resolve(), clear: () => Promise.resolve() }) } },
        { provide: NavController, useValue: jasmine.createSpyObj('NavController', ['navigateRoot']) },
        { provide: SocialSharing, useValue: {} },
        { provide: FcmService, useValue: { getPlan: fcmGetPlan, initPush: () => {} } },
        { provide: SyncService, useValue: {} },
        { provide: DeviceApiService, useValue: {} },
        { provide: MenuController, useValue: jasmine.createSpyObj('MenuController', ['close']) },
        { provide: ToastController, useValue: {} },
        { provide: Device, useValue: { uuid: 'test-uuid' } },
        { provide: HttpClient, useValue: {} },
        { provide: PlanApiService, useValue: {} },
      ],
    }).compileComponents();
  }));

  let appFixture: any;

  afterEach(() => {
    appFixture?.destroy();
  });

  it('should create the app and wire up its dependency graph without throwing', () => {
    appFixture = TestBed.createComponent(AppComponent);
    const app = appFixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
