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
// Strips a query string off a URL before it reaches Sentry — request URLs
// can carry identifiers (see beforeSend below for the full rationale).
function stripQuery(url: string): string {
  return url.split('?')[0];
}

if (environment.sentryDsn) {
  Sentry.init(
    {
      dsn: environment.sentryDsn,
      environment: environment.production ? 'production' : 'development',
      integrations: [SentryAngular.browserTracingIntegration()],
      tracesSampleRate: 0.15,
      // Defense-in-depth scrub, independent of what any individual capture
      // call site attaches: strips query strings (which have carried
      // user_no/uuid — see finding 3b) from request/breadcrumb URLs, and
      // drops any `extra.httpError` a call site might attach (api-client.
      // service.ts used to do exactly this on every failed API call — the
      // raw HttpErrorResponse, including the backend's response body, which
      // can echo back submitted PII in validation messages — see finding
      // 3a). Runs on every event regardless of where it originated.
      beforeSend(event) {
        if (event.request?.url) {
          event.request.url = stripQuery(event.request.url);
        }
        event.breadcrumbs?.forEach(breadcrumb => {
          const url = breadcrumb.data?.['url'];
          if (typeof url === 'string') {
            breadcrumb.data!['url'] = stripQuery(url);
          }
        });
        if (event.extra) {
          delete event.extra['httpError'];
        }
        return event;
      },
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
