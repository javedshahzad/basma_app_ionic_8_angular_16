import {
  Component,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  OnDestroy,
  SimpleChanges
} from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslatePipe } from '@ngx-translate/core';
import dayjs from 'dayjs';

/**
 * Countdown banner shown while a school has a pending self-deletion request
 * (settings page top + classlist page top -- previously only settings had
 * this wired up; classlist had the identical logic written but never
 * rendered). `deleteAt` is the server-computed timestamp
 * (`deactivate_date` + `SCHOOL_DELETION_GRACE_DAYS`, see
 * FormatLegacySchool.js) -- the grace period itself is never duplicated
 * here as a client-side constant.
 */
@Component({
  selector: 'app-school-deletion-banner',
  templateUrl: './school-deletion-banner.component.html',
  styleUrls: ['./school-deletion-banner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, TranslatePipe]
})
export class SchoolDeletionBannerComponent implements OnChanges, OnDestroy {
  /** 'YYYY-MM-DD HH:mm:ss', or null/empty when no deletion is pending. */
  @Input() deleteAt: string | null = null;
  /** Only the school admin (is_school_admin) can actually cancel — Moderator/Viewer see the countdown read-only. */
  @Input() canCancel = false;
  @Output() cancelRequested = new EventEmitter<void>();

  remainingTime: { days: number; hours: number; minutes: number } = { days: 0, hours: 0, minutes: 0 };
  private timerInterval: ReturnType<typeof setInterval> | null = null;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges) {
    if ('deleteAt' in changes) {
      this.restartTimer();
    }
  }

  ngOnDestroy() {
    this.stopTimer();
  }

  onCancelClick() {
    this.cancelRequested.emit();
  }

  private restartTimer() {
    this.stopTimer();
    if (!this.deleteAt) {
      this.remainingTime = { days: 0, hours: 0, minutes: 0 };
      return;
    }
    this.tick();
    this.timerInterval = setInterval(() => this.tick(), 60000);
  }

  private tick() {
    if (!this.deleteAt) return;
    const target = dayjs(this.deleteAt, 'YYYY-MM-DD HH:mm:ss');
    const remaining = target.diff(dayjs());

    if (remaining <= 0) {
      this.remainingTime = { days: 0, hours: 0, minutes: 0 };
    } else {
      this.remainingTime = {
        days: Math.floor(remaining / (1000 * 60 * 60 * 24)),
        hours: Math.floor((remaining / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((remaining / 1000 / 60) % 60)
      };
    }
    this.cdr.markForCheck();
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }
}
