import { Component, ChangeDetectionStrategy } from '@angular/core';
import { NgForm, FormsModule } from '@angular/forms';
import { DataService } from '../service/data/data.service';
import { Platform, IonicModule } from '@ionic/angular';
import { ContactApiService } from '../service/contact-api/contact-api.service';
import { NgIf } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-contact-us',
    templateUrl: './contact-us.page.html',
    styleUrls: ['./contact-us.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, FormsModule, NgIf, TranslatePipe]
})
export class ContactUsPage {
  user: any = {};

  /**
   * Constructor
   * @param dataProvider Use for interacting with the API
   */
  constructor(
    public dataProvider: DataService,
    private platform: Platform,
    private contactApi: ContactApiService
  ) {}

  /**
   * Send the query to backend
   * @param contactForm form from front end
   */
  async submitContactusForm(contactForm: NgForm) {
    if (this.platform.is('android')) {
      this.user.to_email = 'android-support@basmapp.com';
    } else if (this.platform.is('ios')) {
      this.user.to_email = 'ios-support@basmapp.com';
    } else {
      this.user.to_email = 'support@basmapp.com'; // 🟢 للويب والمنصات الأخرى
    }

    try {
      await this.dataProvider.run(() => this.contactApi.sendContact(this.user));
      contactForm.reset();
    } catch (error) {
      this.dataProvider.errorALertMessage(error);
    }
  }

}
