import { APP_INITIALIZER, enableProdMode, ErrorHandler, importProvidersFrom } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import * as Sentry from '@sentry/capacitor';
import * as SentryAngular from '@sentry/angular';

import { createTranslateLoader } from './app/app.module';
import { environment } from './environments/environment';
import { DataService } from './app/service/data/data.service';
import { AuthService } from './app/service/auth/auth.service';
import { DatabaseService } from './app/service/database/database.service';
import { PhotoViewer } from '@awesome-cordova-plugins/photo-viewer/ngx';
import { Printer } from '@awesome-cordova-plugins/printer/ngx';
import { AppRate } from '@awesome-cordova-plugins/app-rate/ngx';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi, HttpClient } from '@angular/common/http';
import { MyInterceptor } from './app/MyInterceptor';
import { GlobalErrorHandler } from './app/global-error-handler';
import { RouteReuseStrategy } from '@angular/router';
import { IonicRouteStrategy, IonicModule } from '@ionic/angular';
import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { IonicStorageModule } from '@ionic/storage-angular';
import { Drivers } from '@ionic/storage';
import { AppRoutingModule } from './app/app-routing.module';
import { PipesModule } from './app/pipes/pipes.module';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { AppComponent } from './app/app.component';

// تفعيل تتبع الأعطال فقط عند ضبط DSN (فارغ افتراضياً في environment.ts محلياً
// حتى لا تُرسَل أخطاء التطوير)؛ راجع environment.prod.ts لإضافة DSN مشروع Sentry
//
// tracesSampleRate: عيّنة صغيرة (15%) من الجلسات الحقيقية لقياس أداء ميداني
// حقيقي (RUM) عبر أجهزة وشبكات المستخدمين الفعليين، إلى جانب قياسات Lighthouse
// المخبرية — راجع خطة العمل الاحترافية لحزمة التحميل الأساسية، المرحلة صفر.
if (environment.sentryDsn) {
  Sentry.init(
    {
      dsn: environment.sentryDsn,
      environment: environment.production ? 'production' : 'development',
      integrations: [SentryAngular.browserTracingIntegration()],
      tracesSampleRate: 0.15,
    },
    SentryAngular.init
  );
}

if (environment.production) {
  enableProdMode();

  // Angular's build pipeline (v16) doesn't expose a way to strip console.log
  // calls from the bundle (no pure_funcs/drop_console hook — see the
  // JavaScriptOptimizerPlugin's hardcoded Terser options), so silence them
  // at runtime instead to stop debug output/data leaking to a device console
  // in production. console.warn/error are left intact.
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.log = () => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  console.debug = () => {};
}

bootstrapApplication(AppComponent, {
    providers: [
        importProvidersFrom(BrowserModule, IonicModule.forRoot({ mode: 'md' }), IonicStorageModule.forRoot({
            name: '__basma_db',
            driverOrder: [Drivers.IndexedDB, Drivers.LocalStorage]
        }), AppRoutingModule, PipesModule, FormsModule, TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: createTranslateLoader,
                deps: [HttpClient]
            }
        })),
        DataService,
        AuthService,
        DatabaseService,
        PhotoViewer,
        Printer,
        AppRate,
        {
            provide: HTTP_INTERCEPTORS,
            useClass: MyInterceptor,
            multi: true
        },
        { provide: ErrorHandler, useClass: GlobalErrorHandler },
        { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
        provideHttpClient(withInterceptorsFromDi()),
        SentryAngular.TraceService,
        {
            provide: APP_INITIALIZER,
            useFactory: () => () => {},
            deps: [SentryAngular.TraceService],
            multi: true
        }
    ]
})
  .catch(err => console.log(err));
