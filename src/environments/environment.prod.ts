export const environment = {
  production: true,
  //  serverURL: " http://192.168.1.20/att-admin/app_service_new/",
      // serverURL: "https://basmapp.com/Att-App/app_service_new/",
      // serverURL: "https://basmapp.com/BasmaCP/app_service_new/",
      serverURL: "https://staging.basmapp.com/api/v1/",
      lang_code: 'en',
      docUrl:"https://basmapp.com/BasmaCP/",
      ipinfoToken: "eebb6806073dbe",
      // ضع DSN مشروعك في Sentry هنا لتفعيل تتبع الأعطال في الإنتاج
      // (Settings > Projects > <project> > Client Keys (DSN) في لوحة Sentry)
      sentryDsn: "https://559fc7bf2e03cf467e6fd52eb5c763a9@o4511849267855360.ingest.de.sentry.io/4511849284960336",
      // reCAPTCHA v3 site key (public by design) — login/school-registration
      // anti-bot. Secret key lives server-side only, in staging.basmapp's env.
      recaptchaSiteKey: "6LcOc6ctAAAAACL0_qEZFaj1LyexPY9pp0k3OFtp"
    // serverURL: "https://basmapp.com/development/app_service_new/",
    // lang_code: 'en',
    // docUrl:"https://basmapp.com/development/"
};
