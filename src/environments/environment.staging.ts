// Staging environment — points the app at the new Node.js mobile API rewrite
// (legacy-compatible replacement for BasmaCP's PHP `app_service_new.php`).
// Used via `ng build --configuration=staging` / `ng serve --configuration=staging`
// (see angular.json's `staging` configuration and package.json's `build:staging`/
// `start:staging` scripts). Kept separate from environment.ts (dev, still points
// at the legacy PHP backend) so staging validation can't accidentally leak into
// a normal dev build.
export const environment = {
  production: false,
  serverURL: "https://production.basmapp.com/api/v1/",//"https://staging.basmapp.com/api/v1/",
  lang_code: 'en',
  docUrl: "https://basmapp.com/BasmaCP/",
  ipinfoToken: "eebb6806073dbe",
  // اتركه فارغاً في staging حتى لا تُرسَل أخطاء بيئة الاختبار إلى Sentry
  sentryDsn: "https://559fc7bf2e03cf467e6fd52eb5c763a9@o4511849267855360.ingest.de.sentry.io/4511849284960336"
};
