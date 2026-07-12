import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { PdfviewerPageRoutingModule } from './pdfviewer-routing.module';

import { PdfviewerPage } from './pdfviewer.page';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { TranslateModule } from '@ngx-translate/core'; // 🟢 إضافة الترجمة

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    PdfviewerPageRoutingModule,
    NgxExtendedPdfViewerModule,
    TranslateModule
  ],
  declarations: [PdfviewerPage]
})
export class PdfviewerPageModule {}