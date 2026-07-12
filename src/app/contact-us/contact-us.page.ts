import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { DataService } from '../service/data/data.service';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-contact-us',
  templateUrl: './contact-us.page.html',
  styleUrls: ['./contact-us.page.scss'],
})
export class ContactUsPage implements OnInit {

    user:any = {};

  /**
   * Constructor
   * @param dataProvider Use for interacting with the API
   */
  constructor(public dataProvider: DataService,private platform:Platform) {
  }

  /**
   * Send the query to backend
   * @param contactForm form from front end
   */
  submitContactusForm(contactForm: NgForm) {
    if (this.platform.is("android")) {
      this.user.to_email = "android-support@basmapp.com";
    } else if (this.platform.is("ios")) {
      this.user.to_email = "ios-support@basmapp.com";
    } else {
      this.user.to_email = "support@basmapp.com"; // 🟢 للويب والمنصات الأخرى
    }
    
    this.dataProvider.showLoading();
    this.dataProvider.sendContact(this.user).then(() => {
      this.dataProvider.hideLoading();
      contactForm.reset();
    }).catch((error) => {
      this.dataProvider.hideLoading();
      this.dataProvider.errorALertMessage(error);
    });
  }

  ngOnInit() {
  }

}
