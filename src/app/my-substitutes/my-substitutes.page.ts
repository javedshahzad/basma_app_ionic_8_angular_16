import { Component, OnInit, DestroyRef, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonicModule } from '@ionic/angular';
import { NgClass } from '@angular/common';
import { Router } from '@angular/router';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { DataService } from '../service/data/data.service';
import { AuthService } from '../service/auth/auth.service';
import { StorageService } from '../service/storage.service';
import { SubstitutesApiService, SubstituteAssignment } from '../service/substitutes-api/substitutes-api.service';

@Component({
  selector: 'app-my-substitutes',
  templateUrl: './my-substitutes.page.html',
  styleUrls: ['./my-substitutes.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, TranslatePipe, NgClass]
})
export class MySubstitutesPage implements OnInit {
  private destroyRef = inject(DestroyRef);

  lang: any = {};
  userDetails: any = { details: {} };
  isLoading = true;
  errorMessage = '';
  pending: SubstituteAssignment[] = [];
  history: SubstituteAssignment[] = [];
  respondingId: number | null = null;

  constructor(
    public dataProvider: DataService,
    public authProvider: AuthService,
    public translate: TranslateService,
    private router: Router,
    private storageSr: StorageService,
    private cdr: ChangeDetectorRef,
    private substitutesApi: SubstitutesApiService
  ) {
    this.dataProvider.language.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.translate.get('my_substitutes').subscribe(res => {
        this.lang = res;
        this.cdr.markForCheck();
      });
    });
  }

  ngOnInit() {
    this.translate.get('my_substitutes').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });
    this.loadRequests();
  }

  async loadRequests() {
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

    this.substitutesApi
      .getMySubstituteRequests(data)
      .then(response => {
        this.isLoading = false;
        if (response.session) {
          const all = response.data || [];
          this.pending = all.filter(a => a.status === 'pending');
          this.history = all.filter(a => a.status !== 'pending');
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

  respond(assignment: SubstituteAssignment, accept: boolean) {
    if (this.respondingId) return;
    this.respondingId = assignment.id;
    this.cdr.markForCheck();

    const data = {
      user_no: this.userDetails.details.user_no,
      school_id: this.userDetails.details.school_id,
      session_id: this.userDetails.session_id,
      id: assignment.id,
      accept: accept ? '1' : '0'
    };

    this.substitutesApi
      .respondToSubstitute(data)
      .then(() => {
        this.respondingId = null;
        this.loadRequests();
      })
      .catch(error => {
        this.respondingId = null;
        this.dataProvider.showToast(typeof error === 'string' ? error : this.lang.respond_error || '');
        this.cdr.markForCheck();
      });
  }

  get hasAny(): boolean {
    return this.pending.length > 0 || this.history.length > 0;
  }

  doRefresh(event: any) {
    this.loadRequests().finally(() => event.target.complete());
  }

  trackById(index: number, item: SubstituteAssignment): number {
    return item.id;
  }
}
