import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { NgIf, NgFor, NgClass } from '@angular/common';
import { DataService } from '../../service/data/data.service';
import { GamificationApiService, SkillData } from '../../service/gamification-api/gamification-api.service';
import { GamificationEngineService, ProcessedTitle, ProcessedBadge } from '../../service/gamification-engine/gamification-engine.service';
import { StudentEngagementService } from '../../service/student-engagement/student-engagement.service';

/**
 * The "خزانة الطالب" (titles/badges) inventory modal, extracted out of
 * student-detail.page.ts — was one of several unrelated features bundled
 * into that page. Fully self-contained except for activeCraftedTitle and
 * studentTitle, which the skills-summary panel on the parent page also
 * displays, so those two are synced back up via output events rather than
 * owned outright here.
 */
@Component({
  selector: 'app-student-inventory-modal',
  templateUrl: './student-inventory-modal.component.html',
  imports: [IonicModule, NgIf, NgFor, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StudentInventoryModalComponent {
  @Input() isOpen = false;
  @Input() sid: string | number;
  @Input() userNo: string | number;
  @Input() skillData: SkillData | null = null;
  @Input() totalPoints = 0;
  @Input() activeCraftedTitle: string | null = null;

  @Output() closed = new EventEmitter<void>();
  @Output() activeCraftedTitleChange = new EventEmitter<string | null>();
  @Output() studentTitleChange = new EventEmitter<string>();
  @Output() skillsRefreshNeeded = new EventEmitter<void>();

  inventoryTab: string = 'titles';
  studentWallet: Record<string, string | number> = {};
  unlockedTitles: string[] = [];
  unlockedBadges: string[] = [];
  processedTitles: ProcessedTitle[] = [];
  processedBadges: ProcessedBadge[] = [];

  constructor(
    private dataProvider: DataService,
    private gamificationApi: GamificationApiService,
    public gamification: GamificationEngineService,
    private studentEngagement: StudentEngagementService,
    private cdr: ChangeDetectorRef
  ) {}

  trackByTitleCode(index: number, title: { code?: string }): string | number {
    return title?.code ?? index;
  }

  trackByBadgeCode(index: number, badge: { code?: string }): string | number {
    return badge?.code ?? index;
  }

  close() {
    this.closed.emit();
  }

  fetchInventory(): Promise<void> {
    return new Promise(resolve => {
      let body = {
        sid: String(this.sid),
        userId: String(this.userNo)
      };

      this.gamificationApi
        .getStudentInventory(body)
        .then((res) => {
          if (res && res.success) {
            this.studentWallet = res.wallet || {};
            this.unlockedTitles = res.unlocked_titles || [];
            this.unlockedBadges = res.unlocked_badges || [];

            let rawActive = res.active_title;
            if (rawActive !== undefined && rawActive !== null && rawActive !== 'null' && rawActive !== '') {
              this.activeCraftedTitle =
                (typeof rawActive === 'object'
                  ? rawActive.title_ar || rawActive.title_name || rawActive.title
                  : rawActive) || null;
              this.activeCraftedTitleChange.emit(this.activeCraftedTitle);
            }

            if (this.gamification) {
              this.studentTitleChange.emit(
                this.gamification.getFinalStudentTitle(this.activeCraftedTitle || '', this.skillData, this.totalPoints)
              );
              this.processedTitles = this.gamification.processTitles(this.unlockedTitles);
              this.processedBadges = this.gamification.processBadges(this.unlockedBadges);
            }
          }

          this.cdr.markForCheck();
          resolve();
        })
        .catch(() => {
          resolve();
        });
    });
  }

  canCraft(cost: ProcessedTitle['cost']): boolean {
    if (!this.studentWallet) return false;
    for (let skill in cost) {
      let spendableAmount = Number(this.studentWallet['spendable_' + skill]) || 0;
      if (spendableAmount < (cost as Record<string, number>)[skill]) return false;
    }
    return true;
  }

  async craftTitle(title: ProcessedTitle) {
    if (!this.canCraft(title.cost)) {
      this.dataProvider.showToast('عفواً، نقاطك لا تكفي لدمج هذا اللقب.');
      return;
    }

    let body = {
      sid: String(this.sid),
      title_code: title.code,
      cost: JSON.stringify(title.cost),
      userId: String(this.userNo)
    };

    try {
      const raw = await this.dataProvider.run(() => this.studentEngagement.craftSkillTitle(body));
      const res = raw as { success?: boolean; msg?: string };
      if (res.success) {
        this.dataProvider.showToast(res.msg || '');
        await this.fetchInventory();
        this.skillsRefreshNeeded.emit();
      } else {
        this.dataProvider.errorALertMessage(res.msg || '');
      }
    } catch (e) {}
  }

  async toggleTitle(titleCode: string | null) {
    let body = {
      sid: String(this.sid),
      title_code: titleCode ? String(titleCode) : '',
      userId: String(this.userNo)
    };

    try {
      const rawRes = await this.dataProvider.run(() => this.studentEngagement.equipTitle(body));
      const res = rawRes as { success?: boolean; msg?: string };
      if (res.success) {
        this.activeCraftedTitle = titleCode;
        this.activeCraftedTitleChange.emit(this.activeCraftedTitle);
        this.dataProvider.showToast(res.msg || '');

        this.studentTitleChange.emit(
          this.gamification.getFinalStudentTitle(titleCode || '', this.skillData, this.totalPoints)
        );
        this.cdr.markForCheck();
      }
    } catch (e) {}
  }
}
