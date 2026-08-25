import { APP_INITIALIZER, ApplicationConfig, ErrorHandler, importProvidersFrom } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  provideHttpClient,
  withInterceptorsFromDi,
  withXhr
} from '@angular/common/http';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage-angular';
import { Drivers } from '@ionic/storage';
import { FormsModule } from '@angular/forms';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { PhotoViewer } from '@awesome-cordova-plugins/photo-viewer/ngx';
import { Printer } from '@awesome-cordova-plugins/printer/ngx';
import { AppRate } from '@awesome-cordova-plugins/app-rate/ngx';
import * as SentryAngular from '@sentry/angular';

import { createTranslateLoader } from './app.module';
import { DataService } from './service/data/data.service';
import { AuthService } from './service/auth/auth.service';
import { DatabaseService } from './service/database/database.service';
import { MyInterceptor } from './MyInterceptor';
import { GlobalErrorHandler } from './global-error-handler';
import { AppRoutingModule } from './app-routing.module';
import { PipesModule } from './pipes/pipes.module';

// نُقلت هنا من bootstrapApplication المضمّن سابقاً في main.ts — هذا هو
// النمط الرسمي (ApplicationConfig) الذي تتوقعه أدوات Angular الحديثة (بما
// فيها SSR/prerender)، بمعزل عن مخاوف المتصفح البحتة (تهيئة Sentry، وضع
// enableProdMode) التي بقيت في main.ts نفسه.
export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      BrowserModule,
      IonicModule.forRoot({ mode: 'md' }),
      IonicStorageModule.forRoot({
        name: '__basma_db',
        driverOrder: [Drivers.IndexedDB, Drivers.LocalStorage]
      }),
      AppRoutingModule,
      PipesModule,
      FormsModule,
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: createTranslateLoader,
          deps: [HttpClient]
        }
      })
    ),
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
    provideHttpClient(withXhr(), withInterceptorsFromDi()),
    SentryAngular.TraceService,
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {},
      deps: [SentryAngular.TraceService],
      multi: true
    }
  ]
};
