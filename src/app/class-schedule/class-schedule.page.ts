import { Component, OnInit, DestroyRef, inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { DataService } from '../service/data/data.service';
import { AuthService } from '../service/auth/auth.service';
import { StorageService } from '../service/storage.service';
import { PermissionService } from '../service/permission/permission.service';
import { SchoolDirectoryApiService } from '../service/school-directory-api/school-directory-api.service';
import { ScheduleApiService, ScheduleSlot } from '../service/schedule-api/schedule-api.service';
import { UserType } from '../constants/user-type';

interface DayGroup {
  dayOfWeek: number;
  dayLabel: string;
  slots: ScheduleSlot[];
}

interface ChildOption {
  sid: number;
  name: string;
}

/** School week is Sunday-Thursday; 0 = Sunday .. 4 = Thursday. */
const SCHOOL_WEEK_DAYS = [0, 1, 2, 3, 4];

@Component({
  selector: 'app-class-schedule',
  templateUrl: './class-schedule.page.html',
  styleUrls: ['./class-schedule.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, TranslatePipe]
})
export class ClassSchedulePage implements OnInit {
  private destroyRef = inject(DestroyRef);

  lang: any = {};
  userDetails: any = { details: {} };
  isParent = false;
  isLoading = true;
  errorMessage = '';
  className = '';
  days: DayGroup[] = [];
  children: ChildOption[] = [];
  selectedSid: number | null = null;

  private allSlots: ScheduleSlot[] = [];

  constructor(
    public dataProvider: DataService,
    public authProvider: AuthService,
    public translate: TranslateService,
    private router: Router,
    private storageSr: StorageService,
    private cdr: ChangeDetectorRef,
    private permissionService: PermissionService,
    private schoolDirectoryApi: SchoolDirectoryApiService,
    private scheduleApi: ScheduleApiService
  ) {
    this.dataProvider.language.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.translate.get('class_schedule').subscribe(res => {
        this.lang = res;
        this.buildDayGroups();
        this.cdr.markForCheck();
      });
    });
  }

  ngOnInit() {
    this.translate.get('class_schedule').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });
    this.init();
  }

  async init() {
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
    this.isParent = this.permissionService.hasRole(UserType.Parent);

    if (this.isParent) {
      await this.loadChildren();
    } else {
      await this.loadSchedule();
    }
  }

  private async loadChildren() {
    const payload = {
      user_no: this.userDetails.details.user_no,
      school_id: this.userDetails.details.school_id,
      session_id: this.userDetails.session_id
    };

    try {
      const result = await this.schoolDirectoryApi.getChildrens(payload);
      this.children = (result.data || []).map((c: any) => ({ sid: c.sid, name: c.name }));
      if (this.children.length === 1) {
        this.selectedSid = this.children[0].sid;
        await this.loadSchedule();
      } else {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    } catch (error) {
      this.isLoading = false;
      this.errorMessage = typeof error === 'string' ? error : this.lang.load_error || '';
      this.cdr.markForCheck();
    }
  }

  selectChild(sid: number) {
    this.selectedSid = sid;
    this.loadSchedule();
  }

  async loadSchedule() {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    const data: Record<string, unknown> = {
      user_no: this.userDetails.details.user_no,
      school_id: this.userDetails.details.school_id,
      session_id: this.userDetails.session_id
    };
    if (this.isParent && this.selectedSid) {
      data['sid'] = this.selectedSid;
    }

    this.scheduleApi
      .getMyClassSchedule(data)
      .then(response => {
        this.isLoading = false;
        if (response.session) {
          this.className = response.data?.className || '';
          this.allSlots = response.data?.slots || [];
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

  get showChildPicker(): boolean {
    return this.isParent && !this.selectedSid && this.children.length > 1;
  }

  doRefresh(event: any) {
    const refresh = this.isParent && !this.selectedSid ? this.loadChildren() : this.loadSchedule();
    refresh.finally(() => event.target.complete());
  }

  trackByDay(index: number, group: DayGroup): number {
    return group.dayOfWeek;
  }

  trackBySlot(index: number, slot: ScheduleSlot): string {
    return `${slot.dayOfWeek}-${slot.periodNo}`;
  }

  trackByChild(index: number, child: ChildOption): number {
    return child.sid;
  }
}
