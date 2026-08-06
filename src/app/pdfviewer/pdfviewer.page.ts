import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { NavController, Platform, IonicModule } from '@ionic/angular';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

@Component({
    selector: 'app-pdfviewer',
    templateUrl: './pdfviewer.page.html',
    styleUrls: ['./pdfviewer.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, NgxExtendedPdfViewerModule]
})
export class PdfviewerPage implements OnInit {
  // 🟢 القيمة الافتراضية إذا لم يتم تمرير رابط
  pdfUrl: string = 'https://basmapp.com/appmanual.pdf';
  pageTitle: string = 'دليل الاستخدام';

  constructor(
    private router: Router,
    public navCtrl: NavController,
    public platform: Platform
  ) {
    // 🟢 التقاط الرابط والعنوان بشكل ديناميكي لتصبح الصفحة قابلة لإعادة الاستخدام
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state) {
      if (navigation.extras.state['pdfUrl']) {
        this.pdfUrl = navigation.extras.state['pdfUrl'];
      }
      if (navigation.extras.state['title']) {
        this.pageTitle = navigation.extras.state['title'];
      }
    }
  }

  ngOnInit() {}
}
