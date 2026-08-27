import { Component, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, AlertController, IonicModule } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router } from '@angular/router';

import {
  GamificationEngineService,
  ProcessedTitle,
  ProcessedBadge
} from '../service/gamification-engine/gamification-engine.service';
// 🟢 1. استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { GamificationApiService, SkillData } from '../service/gamification-api/gamification-api.service';
import { SchoolDirectoryApiService } from '../service/school-directory-api/school-directory-api.service';
import { NgClass } from '@angular/common';
import { LoggedInUser, UserDetails } from '../model/logged-in-user.model';
import { Student } from '../model/student.model';
import { ApiResponse } from '../model/api-response.model';

interface AlchemyTitle extends ProcessedTitle {
  canCraftFlag?: boolean;
}

@Component({
  selector: 'app-student-titles',
  templateUrl: './student-titles.page.html',
  styleUrls: ['./student-titles.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, NgClass, TranslatePipe]
})
export class StudentTitlesPage {
  trackByIndex(index: number): number {
    return index;
  }
  lang: Record<string, string>;
  userDetails: LoggedInUser;
  userType: string;
  navData: UserDetails = {}; // بيانات الهوية (الاسم، الصورة، الصف)
  studentDetails: Student | null = null;

  inventoryTab: string = 'titles'; // 'titles' | 'badges'

  studentWallet: Record<string, string | number> = {};
  unlockedTitles: string[] = [];
  unlockedBadges: string[] = [];
  activeCraftedTitle: string | null = null;

  isLoadingData: boolean = false;
  isLoadingSkills: boolean = false;
  studentTotalPoints: number = 0;
  studentSkillData: SkillData | null = null;
  studentTitle: string = 'جاري التحليل...';

  alchemyTitlesList: AlchemyTitle[] = [];
  secretBadgesList: ProcessedBadge[] = [];

  skillsCardsConfig = [
    {
      key: 'cognitive',
      name: 'عقلي',
      icon: 'bulb',
      hoverBg: 'hover:bg-amber-50',
      iconBg: 'bg-amber-100 text-amber-600',
      iconColor: 'text-amber-500',
      badgeBg: 'bg-amber-500'
    },
    {
      key: 'social',
      name: 'تواصل',
      icon: 'chatbubbles',
      hoverBg: 'hover:bg-blue-50',
      iconBg: 'bg-blue-100 text-blue-600',
      iconColor: 'text-blue-500',
      badgeBg: 'bg-blue-500'
    },
    {
      key: 'discipline',
      name: 'انضباط',
      icon: 'shield-checkmark',
      hoverBg: 'hover:bg-emerald-50',
      iconBg: 'bg-emerald-100 text-emerald-600',
      iconColor: 'text-emerald-500',
      badgeBg: 'bg-emerald-500'
    },
    {
      key: 'emotional',
      name: 'عاطفي',
      icon: 'heart',
      hoverBg: 'hover:bg-rose-50',
      iconBg: 'bg-rose-100 text-rose-600',
      iconColor: 'text-rose-500',
      badgeBg: 'bg-rose-500'
    },
    {
      key: 'practical',
      name: 'عملي',
      icon: 'laptop',
      hoverBg: 'hover:bg-purple-50',
      iconBg: 'bg-purple-100 text-purple-600',
      iconColor: 'text-purple-500',
      badgeBg: 'bg-purple-500'
    }
  ];

  // userDetails.details is genuinely optional on LoggedInUser (a real API
  // response can omit it), but every call site here only runs after
  // ionViewWillEnter()'s `if (userLoggedIn)` guard has already populated
  // it — the non-null assertion documents that invariant once instead of
  // at every access site.
  get userInfo(): UserDetails {
    return this.userDetails.details!;
  }

  constructor(
    public navCtrl: NavController,
    public translate: TranslateService,
    public dataProvider: DataService,
    public authProvider: AuthService,
    public alertCtrl: AlertController,
    public zone: NgZone,
    private router: Router,
    private gamification: GamificationEngineService,
    private storageSr: StorageService, // 🟢 2. حقن خدمة التخزين الجديدة
    private gamificationApi: GamificationApiService,
    private schoolDirectoryApi: SchoolDirectoryApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.translate.get('alertmessages').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });
  }

  // 🟢 3. جعل الدالة async للتخلص من localStorage
  async ionViewWillEnter() {
    let userLoggedIn = await this.storageSr.get('userloggedin'); // 👈 القراءة الآمنة

    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.userType = this.userInfo.user_type || '';
      this.navData = this.userDetails.details || {};

      let sid = this.userInfo.stu_id!;

      // منع تكرار الطلبات إذا كانت الصفحة تقوم بالتحميل بالفعل
      if (this.isLoadingData) return;

      this.loadAllDataSequentially(sid);
    } else {
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  fetchStudentProfile(sid: string | number): Promise<void> {
    return new Promise(resolve => {
      let data = {
        user_no: this.userInfo.user_no,
        session_id: this.userDetails.session_id,
        sid: String(sid),
        cid: '',
        date: new Date().toISOString().split('T')[0]
      };
      this.schoolDirectoryApi
        .getStudentDetails(data)
        .then(res => {
          if (res && res.session && res.data) this.studentDetails = res.data;
          resolve();
        })
        .catch(() => resolve());
    });
  }

  fetchStudentSkills(sid: string | number): Promise<void> {
    return new Promise(resolve => {
      let body = { sid: String(sid), session_id: this.userDetails.session_id };
      this.gamificationApi
        .getStudentSkillTree(body)
        .then(raw => {
          const res = raw as { success?: boolean; total_points?: number; skills?: SkillData } | undefined;
          if (res && res.success) {
            this.studentTotalPoints = res.total_points || 0;
            this.studentSkillData = res.skills || null;
          }
          resolve();
        })
        .catch(() => resolve());
    });
  }

  doRefresh(event: any) {
    let sid = this.userInfo.stu_id!;
    this.loadAllDataSequentially(sid).then(() => {
      event.target.complete();
    });
  }

  async loadAllDataSequentially(sid: string | number) {
    this.isLoadingData = true;
    this.cdr.markForCheck();

    try {
      await this.dataProvider.run(async () => {
        if (!this.studentDetails) {
          await this.fetchStudentProfile(sid);
        }

        await this.fetchStudentSkills(sid);
        await this.fetchInventory(sid);

        this.mapDataToUI();
      });
    } catch (error) {
      console.error('Error loading data', error);
    } finally {
      this.isLoadingData = false;
      this.cdr.markForCheck();
    }
  }

  mapDataToUI() {
    this.updateStudentTitle();

    this.alchemyTitlesList.forEach(title => {
      title.isUnlocked = this.unlockedTitles.includes(title.code);
      title.canCraftFlag = this.canCraft(title.cost);
    });

    this.secretBadgesList.forEach(badge => {
      badge.isUnlocked = this.unlockedBadges.includes(badge.code);
    });

    this.alchemyTitlesList.sort((a, b) => (b.isUnlocked ? 1 : 0) - (a.isUnlocked ? 1 : 0));
    this.secretBadgesList.sort((a, b) => (b.isUnlocked ? 1 : 0) - (a.isUnlocked ? 1 : 0));
  }

  fetchInventory(sid: string | number): Promise<void> {
    return new Promise(resolve => {
      let body = { sid: String(sid), userId: String(this.userInfo.user_no), session_id: this.userDetails.session_id };
      this.gamificationApi
        .getStudentInventory(body)
        .then(res => {
          if (res && res.success) {
            let rawWallet = res.wallet || {};
            this.studentWallet = Array.isArray(rawWallet) ? rawWallet[0] || {} : rawWallet;
            this.unlockedTitles = res.unlocked_titles || [];
            this.unlockedBadges = res.unlocked_badges || [];

            // active_title is a string in most responses but an object in
            // others (see the identical handling in student-detail.page.ts);
            // narrow it the same way here rather than assigning it raw.
            let rawActive = res.active_title;
            if (rawActive !== undefined && rawActive !== null) {
              this.activeCraftedTitle =
                (typeof rawActive === 'object'
                  ? rawActive.title_ar || rawActive.title_name || rawActive.title
                  : rawActive) || null;
            }

            this.alchemyTitlesList = this.gamification.processTitles(this.unlockedTitles);
            this.secretBadgesList = this.gamification.processBadges(this.unlockedBadges);

            this.studentTitle = this.gamification.getFinalStudentTitle(
              this.activeCraftedTitle || '',
              this.studentSkillData,
              this.studentTotalPoints
            );
          }
          resolve();
        })
        .catch(() => resolve());
    });
  }

  updateStudentTitle() {
    if (this.activeCraftedTitle) {
      let matchedTitle = this.alchemyTitlesList.find(t => t.code === this.activeCraftedTitle);
      if (matchedTitle) {
        this.studentTitle = matchedTitle.icon + ' ' + matchedTitle.name;
        return;
      }
    }
    this.studentTitle = this.generateStudentTitle(this.studentSkillData, this.studentTotalPoints);
  }

  generateStudentTitle(skills: SkillData | null | undefined, total: number) {
    if (!skills || total === 0) return '🌱 بطل في البداية';

    let highestSkill = 'general';
    let maxPoints = 0;

    for (const [skill, points] of Object.entries(skills)) {
      let numPoints = Number(points);
      if (skill.toLowerCase() !== 'general' && numPoints > maxPoints) {
        maxPoints = numPoints;
        highestSkill = skill.toLowerCase();
      }
    }

    switch (highestSkill) {
      case 'cognitive':
        return '💡 عبقري المستقبل';
      case 'social':
        return '🤝 روح الفريق';
      case 'discipline':
        return '🛡️ درع الانضباط';
      case 'emotional':
        return '❤️ القلب الكبير';
      case 'practical':
        return '💻 المبدع الرقمي';
      default:
        return '🌟 نجم المشاركة';
    }
  }

  // SkillData only declares its five known keys, but skillsCardsConfig's
  // `key` is a plain string — a template-side bracket access needs a
  // helper rather than a cast, since expressions in .html can't cast.
  getSkillValue(key: string): number {
    return (this.studentSkillData as Record<string, number> | null)?.[key] || 0;
  }

  canCraft(cost: ProcessedTitle['cost']): boolean {
    if (!this.studentWallet || Object.keys(this.studentWallet).length === 0) return false;

    for (let skill in cost) {
      let spendableAmount = Number(this.studentWallet['spendable_' + skill]) || 0;
      if (spendableAmount < (cost as Record<string, number>)[skill]) return false;
    }
    return true;
  }

  async craftTitle(title: AlchemyTitle) {
    if (!this.canCraft(title.cost)) {
      this.dataProvider.showToast('عفواً، نقاطك لا تكفي لدمج هذا اللقب.');
      return;
    }
    let sid = this.userInfo.stu_id!;

    let body = {
      sid: String(sid),
      title_code: title.code,
      cost: JSON.stringify(title.cost),
      userId: String(this.userInfo.user_no),
      session_id: this.userDetails.session_id
    };

    try {
      const res = (await this.dataProvider.run(() => this.gamificationApi.craftSkillTitle(body))) as
        ApiResponse | undefined;
      if (res && res.success) {
        this.dataProvider.showToast(res.msg || '');
        await this.fetchInventory(sid);

        // 🟢 4. استدعاء هذه الدالة إجباري لكي تتحدث حالة الأزرار في الواجهة (من دمج إلى استخدام)
        this.mapDataToUI();
      } else if (res) {
        this.dataProvider.errorALertMessage(res.msg || '');
      }
    } catch (e) {
      this.dataProvider.showToast('حدث خطأ في الاتصال، يرجى المحاولة لاحقاً.');
    }
    this.cdr.markForCheck();
  }

  async toggleTitle(titleCode: string | null) {
    let sid = this.userInfo.stu_id!;

    let body = {
      sid: String(sid),
      title_code: titleCode ? String(titleCode) : '',
      userId: String(this.userInfo.user_no),
      session_id: this.userDetails.session_id
    };

    try {
      const res = (await this.dataProvider.run(() => this.gamificationApi.equipTitle(body))) as ApiResponse | undefined;
      if (res && res.success) {
        this.activeCraftedTitle = titleCode;
        this.dataProvider.showToast(res.msg || '');
        this.updateStudentTitle();
      }
    } catch (e) {
      this.dataProvider.showToast('حدث خطأ في الاتصال، يرجى المحاولة لاحقاً.');
    }
    this.cdr.markForCheck();
  }

  openParentConnect() {
    this.router.navigate(['tabs/parentconnect']);
  }
}
