import { Component, ChangeDetectionStrategy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Browser } from '@capacitor/browser';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-about-us',
    templateUrl: './about-us.page.html',
    styleUrls: ['./about-us.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, TranslatePipe]
})
export class AboutUsPage {
  constructor() {}

  /**
   * Used to open the weblink
   * @param url
   */
  async openUrl(url) {
    await Browser.open({ url: url });
  }

  openPDF(url: string) {
    window.open(url, '_system');
    //browser.show();
  }

}
