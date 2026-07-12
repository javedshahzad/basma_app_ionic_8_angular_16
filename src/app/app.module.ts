import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
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
import { LocationService } from './service/location/location.service';
import { StudentDataService } from './service/student-data/student-data.service';
import { FileUploadService } from './service/file-upload/file-upload.service';
import { DocumentService } from './service/document/document.service';
import { GeoServiceProvider } from './service/geo-service/geo-service';
import { Network } from '@awesome-cordova-plugins/network/ngx';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { HttpClientModule, HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';

import { ScreenOrientation } from '@awesome-cordova-plugins/screen-orientation/ngx';
import { SocialSharing } from '@awesome-cordova-plugins/social-sharing/ngx';
import { Device } from '@awesome-cordova-plugins/device/ngx';

import { PhotoViewer } from '@awesome-cordova-plugins/photo-viewer/ngx';
import { LoaderComponent } from './components/loader/loader.component';
import { RateAppComponent } from './components/rate-app/rate-app.component';
import { SwitchAccountComponent } from './components/switch-account/switch-account.component';
import { EditStudentProfileComponent } from './components/edit-student-profile/edit-student-profile.component';
import { AppRate } from '@awesome-cordova-plugins/app-rate/ngx';


import { Printer } from '@awesome-cordova-plugins/printer/ngx';
import { PipesModule } from './pipes/pipes.module';
import { MyInterceptor } from './MyInterceptor';
import { StudentDetailsComponent } from './components/student-details/student-details.component';
import { AvatarImagesComponent } from './components/avatar-images/avatar-images.component';
import { SubscribePlanComponent } from './components/subscribe-plan/subscribe-plan.component';
import { DurationSubscriptionComponent } from './duration-subscription/duration-subscription.component';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { PlanReceiptComponent } from './plan-receipt/plan-receipt.component';

import { StudentOptionsPopoverComponent } from './components/student-options-popover/student-options-popover.component';
import { AdminActionsPopoverComponent } from './components/admin-actions-popover/admin-actions-popover.component';
import { StudentPointsPopoverComponent } from './components/student-points-popover (deleted)/student-points-popover.component';
import { ImageOptionPopoverComponent } from './components/image-option-popover/image-option-popover.component';
import { PrintOptionsPopoverComponent } from './components/print-options-popover/print-options-popover.component';
import { EditDeleteNotePopoverComponent } from './components/edit-delete-note-popover/edit-delete-note-popover.component';

import { StudentProfileModalComponent } from './components/student-profile-modal/student-profile-modal.component';
import { AddStudentModalComponent } from './components/add-student-modal/add-student-modal.component';
import { SkillTreeModalComponent } from './components/skill-tree-modal/skill-tree-modal.component';

import { registerLocaleData } from '@angular/common';
import localeAr from '@angular/common/locales/ar';

import { SQLite } from '@awesome-cordova-plugins/sqlite/ngx';

// تسجيل اللغة العربية في نواة التطبيق
registerLocaleData(localeAr, 'ar-KW');

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    LoaderComponent,
  ],
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
    NgxExtendedPdfViewerModule,
    HttpClientModule,
    RateAppComponent,
    SwitchAccountComponent,
    EditStudentProfileComponent,
    StudentDetailsComponent,
    AvatarImagesComponent,
    SubscribePlanComponent,
    DurationSubscriptionComponent,
    PlanReceiptComponent,
    StudentOptionsPopoverComponent,
    AdminActionsPopoverComponent,
    StudentPointsPopoverComponent,
    ImageOptionPopoverComponent,
    PrintOptionsPopoverComponent,
    EditDeleteNotePopoverComponent,
    StudentProfileModalComponent,
    AddStudentModalComponent,
    SkillTreeModalComponent,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    })
  ],
  providers: [
    DataService,
    AuthService,
    SQLite,
    DocumentService,
    LocationService,
    StudentDataService,
    DatabaseService,
    FileUploadService,
    Network,
    ScreenOrientation,
    SocialSharing,
    Device,
    GeoServiceProvider,
    PhotoViewer,
    Printer,
    AppRate,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MyInterceptor,
      multi: true,
    },
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy }
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent]
})
export class AppModule {}