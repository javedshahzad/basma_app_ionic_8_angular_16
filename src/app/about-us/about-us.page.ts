import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Browser } from '@capacitor/browser';

@Component({
  selector: 'app-about-us',
  templateUrl: './about-us.page.html',
  styleUrls: ['./about-us.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutUsPage implements OnInit {

    constructor() {
  }

  /**
   * Used to open the weblink
   * @param url 
   */
  async openUrl(url){
     await Browser.open({ url: url });
  }

  openPDF(url: string) {
    window.open(url, '_system');
    //browser.show();
  }

  ngOnInit() {
  }

}
 