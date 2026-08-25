import { Component, NgZone, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, AlertController, Platform, IonContent, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router, ActivatedRoute } from '@angular/router';
import { PasswordResetApiService } from '../service/password-reset-api/password-reset-api.service';
import { NgIf, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-forgot-password',
    templateUrl: './forgot-password.page.html',
    styleUrls: ['./forgot-password.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, NgIf, NgClass, FormsModule, TranslatePipe]
})
export class ForgotPasswordPage {
  // 🟢 استدعاء المحتوى للتحكم في التمرير (Scrolling) بطريقة Angular الآمنة
  @ViewChild(IonContent, { static: false }) content: IonContent;

  enterdEmail: any;
  email: any = '';
  otp: any = '';
  password: any = '';
  confirm_password: any = '';

  enterEmail = true;
  enterPassword = false;
  enterOtp = false;

  canEditEmail = true;
  canEditOTP = true;
  canEditPass = true;

  emailError = '';
  otpError = '';
  passwordError = '';
  confirm_passwordError = '';

  lang: any = {};
  step = 0;

  constructor(
    public navCtrl: NavController,
    public dataProvider: DataService,
    public authProvider: AuthService,
    public translate: TranslateService,
    private route: ActivatedRoute,
    private router: Router,
    public zone: NgZone,
    private passwordResetApi: PasswordResetApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.translate.get('alertmessages').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });

    // 🟢 استلام البريد الإلكتروني إذا تم تحويله من صفحة الدخول
    const navigation = this.router.getCurrentNavigation();
    if (navigation && navigation.extras && navigation.extras.state) {
      this.email = navigation.extras.state['email'] || '';
    }
  }


  // 🟢 التمرير الآمن لأسفل الصفحة بدلاً من استخدام document.getElementById
  scrollToBottom() {
    setTimeout(() => {
      if (this.content) {
        this.content.scrollToBottom(400);
      }
    }, 150);
  }

  sendOTP() {
    let pattern = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/;

    if (!this.email || this.email.trim() === '') {
      this.emailError = this.lang.email_empty || 'البريد الإلكتروني مطلوب';
    } else if (!this.email.match(pattern)) {
      this.emailError = this.lang.email_valid || 'صيغة البريد الإلكتروني غير صحيحة';
    } else {
      this.emailError = '';
      let data = { email: this.email.trim() };

      this.dataProvider
        .run(() => this.passwordResetApi.submitEmail(data))
        .then(res => {
          if (res.session) {
            this.step++;
            this.canEditEmail = false;
            this.enterOtp = true;
            this.scrollToBottom();
          } else {
            this.emailError = res.message || '';
          }
          this.cdr.markForCheck();
        })
        .catch(error => {
          this.dataProvider.showToast(error);
          this.cdr.markForCheck();
        });
    }
  }

  submitOTP() {
    if (!this.otp || this.otp.trim() === '') {
      this.otpError = this.lang.otp_empty || 'رمز التحقق مطلوب';
    } else {
      this.otpError = '';
      let data = {
        email: this.email.trim(),
        otp: this.otp.trim()
      };

      this.dataProvider
        .run(() => this.passwordResetApi.checkOtp(data))
        .then(res => {
          if (res.session) {
            this.canEditOTP = false;
            this.enterPassword = true;
            this.step++;
            this.scrollToBottom();
          } else {
            this.otpError = res.message || '';
          }
          this.cdr.markForCheck();
        })
        .catch(error => {
          this.dataProvider.showToast(error);
          this.cdr.markForCheck();
        });
    }
  }

  submitPassword() {
    if (!this.password) {
      this.passwordError = this.lang.password_empty || 'كلمة المرور مطلوبة';
      this.confirm_passwordError = '';
    } else if (!this.confirm_password) {
      this.passwordError = '';
      this.confirm_passwordError = this.lang.confirmP_empty || 'تأكيد كلمة المرور مطلوب';
    } else if (this.password !== this.confirm_password) {
      this.passwordError = '';
      this.confirm_passwordError = this.lang.pass_not_match || 'كلمتا المرور غير متطابقتين';
    } else {
      this.passwordError = '';
      this.confirm_passwordError = '';
      let data = {
        email: this.email.trim(),
        password: this.password,
        c_password: this.confirm_password,
        // New API requires otp_no on reset_password (legacy never validated
        // it here) — reuse the OTP already collected in step 2 (submitOTP()).
        // Sent as both otp_no (the required field name) and otp (the
        // documented mobile alias) for safety.
        otp_no: this.otp.trim(),
        otp: this.otp.trim()
      };

      this.dataProvider
        .run(() => this.passwordResetApi.resetPassword(data))
        .then(res => {
          if (res.session) {
            this.step++;
            this.canEditPass = false;
            this.dataProvider.showToast(res.message || '');

            // توجيه لصفحة تسجيل الدخول بهدوء
            setTimeout(() => {
              this.router.navigate(['login'], { replaceUrl: true });
            }, 1500);
          } else {
            this.dataProvider.showToast(res.message || '');
          }
          this.cdr.markForCheck();
        })
        .catch(error => {
          this.dataProvider.showToast(error);
          this.cdr.markForCheck();
        });
    }
  }
}
