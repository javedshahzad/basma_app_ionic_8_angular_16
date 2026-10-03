import { ApplicationConfig, ErrorHandler, importProvidersFrom } from '@angular/core';
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
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MyInterceptor,
      multi: true
    },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideHttpClient(withXhr(), withInterceptorsFromDi())
    // Sentry's router-tracing (TraceService) is wired up manually in
    // main.ts, post-bootstrap, once the SDK finishes loading — not
    // registered as an eager root provider here. @sentry/angular is a
    // sizeable package that's only needed to *observe* the app, not to run
    // it; registering TraceService here would force it into the initial
    // bundle for every user regardless of whether a DSN is configured. See
    // sentry-lazy.ts.
  ]
};
