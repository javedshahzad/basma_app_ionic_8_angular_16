import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';

// تسجيل اللغة العربية في نواة التطبيق
registerLocaleData(localeAr, 'ar-KW');

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}
