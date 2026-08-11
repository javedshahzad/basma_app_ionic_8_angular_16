import { enableProdMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';

import * as Sentry from '@sentry/capacitor';
import * as SentryAngular from '@sentry/angular';

import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

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

bootstrapApplication(AppComponent, appConfig).catch(err => console.log(err));
