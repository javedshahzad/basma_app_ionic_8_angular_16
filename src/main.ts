import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import * as Sentry from '@sentry/capacitor';
import * as SentryAngular from '@sentry/angular';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

// تفعيل تتبع الأعطال فقط عند ضبط DSN (فارغ افتراضياً في environment.ts محلياً
// حتى لا تُرسَل أخطاء التطوير)؛ راجع environment.prod.ts لإضافة DSN مشروع Sentry
if (environment.sentryDsn) {
  Sentry.init(
    {
      dsn: environment.sentryDsn,
      environment: environment.production ? 'production' : 'development',
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

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.log(err));
