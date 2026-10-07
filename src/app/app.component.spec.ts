import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, Subject, throwError } from 'rxjs';

import { Platform, MenuController, NavController, ToastController } from '@ionic/angular';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Storage as IonicStorage } from '@ionic/storage-angular';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

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
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    imports: [RouterTestingModule.withRoutes([]), TranslateModule.forRoot(), AppComponent],
    providers: [
        { provide: Platform, useValue: jasmine.createSpyObj('Platform', { ready: Promise.resolve(), is: false }) },
        { provide: StorageService, useValue: storageSrSpy },
        { provide: TranslateService, useValue: translateSpy },
        { provide: AuthService, useValue: { event: authEvent } },
        { provide: DataService, useValue: dataProviderSpy },
        { provide: DatabaseService, useValue: jasmine.createSpyObj('DatabaseService', {
                openDataBase: Promise.resolve(),
                tryOpenDataBase: Promise.resolve(true),
                createTable: undefined
            }) },
        { provide: IonicStorage, useValue: { create: () => Promise.resolve({ get: () => Promise.resolve(null), set: () => Promise.resolve(), remove: () => Promise.resolve(), clear: () => Promise.resolve() }) } },
        { provide: NavController, useValue: jasmine.createSpyObj('NavController', ['navigateRoot']) },
        { provide: FcmService, useValue: { getPlan: fcmGetPlan, initPush: () => { } } },
        { provide: SyncService, useValue: {} },
        { provide: DeviceApiService, useValue: {} },
        { provide: MenuController, useValue: jasmine.createSpyObj('MenuController', ['close']) },
        { provide: ToastController, useValue: {} },
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

  it('tryLogin does not raise an unhandled error when the device is offline (Sentry 151218027)', async () => {
    // Only tryLogin() is under test; an empty template keeps the (mocked) translate pipe out of it.
    TestBed.overrideComponent(AppComponent, { set: { template: '' } });
    appFixture = TestBed.createComponent(AppComponent);
    const app = appFixture.componentInstance;

    storageSrSpy.get.and.callFake((key: string) =>
      Promise.resolve(key === 'userloggedin' ? { details: { user_no: '1', country_code: 'KW', school_id: 2 } } : null)
    );
    const get = jasmine.createSpy('get').and.returnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    app.http = { get };

    await app.tryLogin();
    // An unhandled subscriber error is rethrown on a timer; give it the chance to fail the spec.
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(get).toHaveBeenCalled();
  });

  describe('device check poll', () => {
    const run = async (visibility: 'hidden' | 'visible') => {
      appFixture = TestBed.createComponent(AppComponent);
      const app = appFixture.componentInstance;
      storageSrSpy.get.and.callFake((key: string) =>
        Promise.resolve(key === 'userloggedin' ? { details: { user_no: '1' }, session_id: 's' } : null)
      );
      const check = jasmine.createSpy('CheckDeviceLogInStatus').and.returnValue(Promise.resolve({ success: true, data: {} }));
      app.deviceApi = { CheckDeviceLogInStatus: check };
      spyOnProperty(document, 'visibilityState', 'get').and.returnValue(visibility);
      await app.CheckDeviceLogInStatus();
      return check;
    };

    it('does not call the server while the app is in the background', async () => {
      TestBed.overrideComponent(AppComponent, { set: { template: '' } });
      expect(await run('hidden')).not.toHaveBeenCalled();
    });

    it('calls the server while the app is visible', async () => {
      TestBed.overrideComponent(AppComponent, { set: { template: '' } });
      expect(await run('visible')).toHaveBeenCalledTimes(1);
    });
  });
});
