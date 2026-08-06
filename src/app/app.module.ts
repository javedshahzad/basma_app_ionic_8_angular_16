import { CUSTOM_ELEMENTS_SCHEMA, ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { IonicStorageModule } from '@ionic/storage-angular';
import { Drivers } from '@ionic/storage';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { DataService } from './service/data/data.service';
import { AuthService } from './service/auth/auth.service';
import { DatabaseService } from './service/database/database.service';
import { StudentDataService } from './service/student-data/student-data.service';
import { FileUploadService } from './service/file-upload/file-upload.service';
import { DocumentService } from './service/document/document.service';
import { GeoServiceProvider } from './service/geo-service/geo-service';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClient, HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { PhotoViewer } from '@awesome-cordova-plugins/photo-viewer/ngx';
import { LoaderComponent } from './components/loader/loader.component';
import { AppRate } from '@awesome-cordova-plugins/app-rate/ngx';

import { Printer } from '@awesome-cordova-plugins/printer/ngx';
import { PipesModule } from './pipes/pipes.module';
import { MyInterceptor } from './MyInterceptor';
import { GlobalErrorHandler } from './global-error-handler';

import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';

// تسجيل اللغة العربية في نواة التطبيق
registerLocaleData(localeAr, 'ar-KW');

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
    declarations: [AppComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    bootstrap: [AppComponent],
    imports: [
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
        }),
        LoaderComponent
    ],
    providers: [
        DataService,
        AuthService,
        DocumentService,
        StudentDataService,
        DatabaseService,
        FileUploadService,
        GeoServiceProvider,
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
        provideHttpClient(withInterceptorsFromDi())
    ]
})
export class AppModule {}
