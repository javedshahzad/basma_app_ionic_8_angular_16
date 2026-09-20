import { Component, OnInit, DestroyRef, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { DataService } from '../service/data/data.service';
import { AuthService } from '../service/auth/auth.service';
import { StorageService } from '../service/storage.service';
import { TimetableApiService, TimetableSlot } from '../service/timetable-api/timetable-api.service';

interface DayGroup {
  dayOfWeek: number;
  dayLabel: string;
  slots: TimetableSlot[];
}

/** School week is Sunday-Thursday; 0 = Sunday .. 4 = Thursday. */
const SCHOOL_WEEK_DAYS = [0, 1, 2, 3, 4];

@Component({
  selector: 'app-my-schedule',
  templateUrl: './my-schedule.page.html',
  styleUrls: ['./my-schedule.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, TranslatePipe]
})
export class MySchedulePage implements OnInit {
  private destroyRef = inject(DestroyRef);

  lang: any = {};
  userDetails: any = { details: {} };
  isLoading = true;
  errorMessage = '';
  days: DayGroup[] = [];

  constructor(
    public dataProvider: DataService,
    public authProvider: AuthService,
    public translate: TranslateService,
    private router: Router,
    private storageSr: StorageService,
    private cdr: ChangeDetectorRef,
    private timetableApi: TimetableApiService
  ) {
    this.dataProvider.language.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.translate.get('my_schedule').subscribe(res => {
        this.lang = res;
        this.buildDayGroups();
        this.cdr.markForCheck();
      });
    });
  }

  ngOnInit() {
    this.translate.get('my_schedule').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });
    this.loadSchedule();
  }

  private allSlots: TimetableSlot[] = [];

  async loadSchedule() {
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

    this.timetableApi
      .getMyTimetable(data)
      .then(response => {
        this.isLoading = false;
        if (response.session) {
          this.allSlots = response.data || [];
          this.buildDayGroups();
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

  private buildDayGroups() {
    this.days = SCHOOL_WEEK_DAYS.map(dayOfWeek => ({
      dayOfWeek,
      dayLabel: this.lang.days?.[dayOfWeek] || '',
      slots: this.allSlots
        .filter(slot => slot.dayOfWeek === dayOfWeek)
        .sort((a, b) => a.periodNo - b.periodNo)
    })).filter(group => group.slots.length > 0);
  }

  get hasAnySlots(): boolean {
    return this.allSlots.length > 0;
  }

  doRefresh(event: any) {
    this.loadSchedule().finally(() => event.target.complete());
  }

  trackByDay(index: number, group: DayGroup): number {
    return group.dayOfWeek;
  }

  trackBySlot(index: number, slot: TimetableSlot): string {
    return `${slot.dayOfWeek}-${slot.periodNo}`;
  }
}
