import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../service/data/data.service';
import { IonicModule } from '@ionic/angular';
import { RegistrationApiService } from '../service/registration-api/registration-api.service';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

/**
 * docs/SELF_REGISTRATION_VIA_SCHOOL_CODE_PLAN.md §6.4 -- rebuilt as a
 * join-code self-registration form (School Code, Full Name, Username,
 * Password, Confirm Password), replacing the old invite-link/base64-token
 * flow. The account created here is pending approval, so this page does
 * NOT log the user in on success -- it shows a confirmation message and
 * routes back to login.
 */
@Component({
  selector: 'app-register-teacher',
  templateUrl: './register-teacher.page.html',
  styleUrls: ['./register-teacher.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, FormsModule, TranslatePipe]
})
export class RegisterTeacherPage {
  teacher: { joinCode: string; name: string; username: string; password: string; confirmPassword: string } = {
    joinCode: '',
    name: '',
    username: '',
    password: '',
    confirmPassword: ''
  };

  schoolName: string = '';
  schoolLookupState: 'idle' | 'checking' | 'valid' | 'invalid' = 'idle';
  submitted: boolean = false;
  lang: Record<string, string> = {};

  constructor(
    public dataProvider: DataService,
    private router: Router,
    private translate: TranslateService,
    private registrationApi: RegistrationApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.translate.get('reg_teacher').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });
  }

  async checkJoinCode() {
    const code = (this.teacher.joinCode || '').trim();
    if (!code) {
      this.schoolLookupState = 'idle';
      this.schoolName = '';
      this.cdr.markForCheck();
      return;
    }

    this.schoolLookupState = 'checking';
    this.cdr.markForCheck();

    try {
      const result = await this.registrationApi.lookupSchoolByCode(code);
      if (!result.teacher_registration_enabled) {
        this.schoolLookupState = 'invalid';
        this.schoolName = '';
      } else {
        this.schoolLookupState = 'valid';
        this.schoolName = result.school_name;
      }
    } catch {
      this.schoolLookupState = 'invalid';
      this.schoolName = '';
    }
    this.cdr.markForCheck();
  }

  async registerTeacher() {
    if (this.teacher.password !== this.teacher.confirmPassword) {
      this.dataProvider.errorALertMessage(this.lang['password_mismatch'] || '');
      return;
    }

    await this.checkJoinCode();
    if (this.schoolLookupState !== 'valid') {
      this.dataProvider.errorALertMessage(this.lang['invalid_code'] || '');
      return;
    }

    try {
      await this.dataProvider.run(() =>
        this.registrationApi.registerTeacherByCode({
          join_code: this.teacher.joinCode.trim(),
          name: this.teacher.name,
          username: this.teacher.username,
          password: this.teacher.password
        })
      );
      this.submitted = true;
      this.cdr.markForCheck();
    } catch (err) {
      this.dataProvider.errorALertMessage(err instanceof Error ? err.message : String(err));
    }
  }

  backToLogin() {
    this.router.navigate(['login'], { replaceUrl: true });
  }
}
