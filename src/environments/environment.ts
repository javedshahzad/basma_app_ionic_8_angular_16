// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.  
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // serverURL: "http://192.168.1.20/att-admin/app_service_new/", 
    // serverURL: "https://webapp.ws/Att-App/cpanel/app_service_new/",

    // serverURL: "https://basmapp.com/Att-App/app_service_new/",
    // lang_code: 'en',
    // docUrl:"https://basmapp.com/Att-App/"


    // serverURL: "https://basmapp.com/development/app_service_new/",
    serverURL: "https://basmapp.com/BasmaCP/app_service_new/",
    lang_code: 'en',
    docUrl:"https://basmapp.com/BasmaCP/",
    ipinfoToken: "eebb6806073dbe",
    // اتركه فارغاً محلياً حتى لا تُرسَل أخطاء بيئة التطوير إلى Sentry
    sentryDsn: "https://559fc7bf2e03cf467e6fd52eb5c763a9@o4511849267855360.ingest.de.sentry.io/4511849284960336"


};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
    