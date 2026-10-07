import { enableProdMode, provideZoneChangeDetection, Injector } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { Router } from '@angular/router';

import { environment } from './environments/environment';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { loadSentryAngular } from './app/service/sentry/sentry-lazy';

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

// Sentry's own packages (~177 KB combined) are dynamically imported — see
// sentry-lazy.ts — so this fires in the background after bootstrap instead
// of adding weight to the app's initial/critical bundle. It's fire-and-
// forget: nothing in the app depends on Sentry being ready synchronously.
// `injector` is the bootstrapped app's root injector, passed in once
// bootstrapApplication() resolves below, so TraceService (router-tracing
// spans) can be instantiated manually here instead of via an eager
// APP_INITIALIZER provider in app.config.ts.
async function initSentry(injector: Injector): Promise<void> {
  const sentryAngularPromise = loadSentryAngular();
  if (!sentryAngularPromise) return;

  const [Sentry, SentryAngular] = await Promise.all([import('@sentry/capacitor'), sentryAngularPromise]);

  Sentry.init(
    {
      dsn: environment.sentryDsn,
      environment: environment.production ? 'production' : 'development',
      integrations: [SentryAngular.browserTracingIntegration()],
      tracesSampleRate: 0.15,
      // ionic-selectable's open()/close() reject with a plain string when the control is
      // tapped twice (the second tap finds it already open/closed) and its own callers
      // have no .catch. The user's selection is already made, so there is nothing to act
      // on (Sentry 151187994).
      ignoreErrors: [/IonicSelectable is disabled or already (opened|closed)/],
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
      }
    },
    SentryAngular.init
  );

  // Kept alive via module scope — its constructor subscribes to
  // router.events for the lifetime of the app, matching what the
  // DI-registered provider used to do.
  traceService = new SentryAngular.TraceService(injector.get(Router));
}

let traceService: unknown;

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
  ...appConfig,
  providers: [provideZoneChangeDetection(), ...appConfig.providers]
})
  .then(appRef => initSentry(appRef.injector))
  .catch(err => console.log(err));
