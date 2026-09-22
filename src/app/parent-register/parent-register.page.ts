import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { DataService } from '../service/data/data.service';
import { IonicModule } from '@ionic/angular';
import { RegistrationApiService } from '../service/registration-api/registration-api.service';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

/**
 * docs/SELF_REGISTRATION_VIA_SCHOOL_CODE_PLAN.md §6.5 -- rebuilt as a
 * join-code self-registration form (School Code, Full Name, Username,
 * Password, Confirm Password, Student ID), replacing the old invite-link
 * flow. Same "pending approval, not auto-logged-in" result as
 * register-teacher; additionally surfaces whether the student id matched
 * one in this school (studentLinked), per plan §1's requirement.
 */
@Component({
  selector: 'app-parent-register',
  templateUrl: './parent-register.page.html',
  styleUrls: ['./parent-register.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, FormsModule, TranslatePipe]
})
export class ParentRegisterPage {
  parent: { joinCode: string; name: string; username: string; password: string; confirmPassword: string; studentId: string } = {
    joinCode: '',
    name: '',
    username: '',
    password: '',
    confirmPassword: '',
    studentId: ''
  };

  schoolName: string = '';
  schoolLookupState: 'idle' | 'checking' | 'valid' | 'invalid' = 'idle';
  submitted: boolean = false;
  studentLinked: boolean = true;
  lang: Record<string, string> = {};

  constructor(
    public dataProvider: DataService,
    private router: Router,
    private translate: TranslateService,
    private registrationApi: RegistrationApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.translate.get('reg_parent').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });
  }

  async checkJoinCode() {
    const code = (this.parent.joinCode || '').trim();
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
      if (!result.parent_registration_enabled) {
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

  async registerparent() {
    if (this.parent.password !== this.parent.confirmPassword) {
      this.dataProvider.errorALertMessage(this.lang['password_mismatch'] || '');
      return;
    }

    await this.checkJoinCode();
    if (this.schoolLookupState !== 'valid') {
      this.dataProvider.errorALertMessage(this.lang['invalid_code'] || '');
      return;
    }

    try {
      const result = await this.dataProvider.run(() =>
        this.registrationApi.registerParentByCode({
          join_code: this.parent.joinCode.trim(),
          name: this.parent.name,
          username: this.parent.username,
          password: this.parent.password,
          student_id: this.parent.studentId
        })
      );
      this.studentLinked = result.studentLinked;
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
