import { Component, OnInit, DestroyRef, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { DataService } from '../service/data/data.service';
import { AuthService } from '../service/auth/auth.service';
import { StorageService } from '../service/storage.service';
import { ExamsApiService, ExamSession } from '../service/exams-api/exams-api.service';

@Component({
  selector: 'app-my-invigilation-duties',
  templateUrl: './my-invigilation-duties.page.html',
  styleUrls: ['./my-invigilation-duties.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, TranslatePipe]
})
export class MyInvigilationDutiesPage implements OnInit {
  private destroyRef = inject(DestroyRef);

  lang: any = {};
  userDetails: any = { details: {} };
  isLoading = true;
  errorMessage = '';
  duties: ExamSession[] = [];

  constructor(
    public dataProvider: DataService,
    public authProvider: AuthService,
    public translate: TranslateService,
    private router: Router,
    private storageSr: StorageService,
    private cdr: ChangeDetectorRef,
    private examsApi: ExamsApiService
  ) {
    this.dataProvider.language.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.translate.get('my_invigilation_duties').subscribe(res => {
        this.lang = res;
        this.cdr.markForCheck();
      });
    });
  }

  ngOnInit() {
    this.translate.get('my_invigilation_duties').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });
    this.loadDuties();
  }

  async loadDuties() {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    const userLoggedIn = await this.storageSr.get('userloggedin');
    if (!userLoggedIn || !userLoggedIn.details) {
      this.isLoading = false;
      this.cdr.markForCheck();
      return;
    }

    this.userDetails = userLoggedIn;
    const data = {
      user_no: this.userDetails.details.user_no,
      school_id: this.userDetails.details.school_id,
      session_id: this.userDetails.session_id
    };

    this.examsApi
      .getMyInvigilationDuties(data)
      .then(response => {
        this.isLoading = false;
        if (response.session) {
          this.duties = response.data || [];
        } else {
          this.authProvider.flushLocalStorage();
          this.router.navigate(['login'], { replaceUrl: true });
          this.dataProvider.errorALertMessage(response.message || '');
        }
        this.cdr.markForCheck();
      })
      .catch(error => {
        this.isLoading = false;
        this.errorMessage = typeof error === 'string' ? error : this.lang.load_error || '';
        this.cdr.markForCheck();
      });
  }

  doRefresh(event: any) {
    this.loadDuties().finally(() => event.target.complete());
  }

  trackById(index: number, item: ExamSession): number {
    return item.id;
  }
}
