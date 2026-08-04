import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';

import { GamificationEngineService } from '../service/gamification-engine/gamification-engine.service';
// 🟢 1. استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';
import { GamificationApiService } from '../service/gamification-api/gamification-api.service';

@Component({
  selector: 'app-student-titles',
  templateUrl: './student-titles.page.html',
  styleUrls: ['./student-titles.page.scss'],
})
export class StudentTitlesPage implements OnInit {
  trackByIndex(index: number): number { return index; }
  lang: any;
  userDetails: any;
  userType: any;
  navData: any = {}; // بيانات الهوية (الاسم، الصورة، الصف)
  studentDetails: any = null;
  
  inventoryTab: string = 'titles'; // 'titles' | 'badges'
  
  studentWallet: any = {};
  unlockedTitles: string[] = [];
  unlockedBadges: string[] = [];
  activeCraftedTitle: string = null;

  isLoadingData: boolean = false;
  isLoadingSkills: boolean = false;
  studentTotalPoints: number = 0;
  studentSkillData: any = null;
  studentTitle: string = 'جاري التحليل...';

  alchemyTitlesList: any[] = [];
  secretBadgesList: any[] = [];

  skillsCardsConfig = [
    { key: 'cognitive', name: 'عقلي', icon: 'bulb', hoverBg: 'hover:bg-amber-50', iconBg: 'bg-amber-100 text-amber-600', iconColor: 'text-amber-500', badgeBg: 'bg-amber-500' },
    { key: 'social', name: 'تواصل', icon: 'chatbubbles', hoverBg: 'hover:bg-blue-50', iconBg: 'bg-blue-100 text-blue-600', iconColor: 'text-blue-500', badgeBg: 'bg-blue-500' },
    { key: 'discipline', name: 'انضباط', icon: 'shield-checkmark', hoverBg: 'hover:bg-emerald-50', iconBg: 'bg-emerald-100 text-emerald-600', iconColor: 'text-emerald-500', badgeBg: 'bg-emerald-500' },
    { key: 'emotional', name: 'عاطفي', icon: 'heart', hoverBg: 'hover:bg-rose-50', iconBg: 'bg-rose-100 text-rose-600', iconColor: 'text-rose-500', badgeBg: 'bg-rose-500' },
    { key: 'practical', name: 'عملي', icon: 'laptop', hoverBg: 'hover:bg-purple-50', iconBg: 'bg-purple-100 text-purple-600', iconColor: 'text-purple-500', badgeBg: 'bg-purple-500' }
  ];

  constructor(public navCtrl: NavController,
              public translate: TranslateService,
              public dataProvider: DataService,
              public authProvider: AuthService,
              public alertCtrl: AlertController,
              public zone: NgZone,
              private router: Router,
              private gamification: GamificationEngineService,
              private storageSr: StorageService, // 🟢 2. حقن خدمة التخزين الجديدة
              private gamificationApi: GamificationApiService
             ) {
                
    this.translate.get("alertmessages").subscribe((res) => {
      this.lang = res;
    });
  }

  ngOnInit() {}

  // 🟢 3. جعل الدالة async للتخلص من localStorage 
  async ionViewWillEnter() {
    let userLoggedIn = await this.storageSr.get("userloggedin"); // 👈 القراءة الآمنة

    if (userLoggedIn) {
      this.userDetails = userLoggedIn;
      this.userType = this.userDetails.details.user_type;
      this.navData = this.userDetails.details;
      
      let sid = this.userDetails.details.stu_id; 
      
      // منع تكرار الطلبات إذا كانت الصفحة تقوم بالتحميل بالفعل
      if(this.isLoadingData) return; 

      this.loadAllDataSequentially(sid);

    } else {
      this.authProvider.flushLocalStorage();
      this.router.navigate(['login'], { replaceUrl: true });
    }
  }

  fetchStudentProfile(sid: any): Promise<void> {
    return new Promise((resolve) => {
      let data = {
        "user_no": this.userDetails.details.user_no,
        "session_id": this.userDetails.session_id,
        "sid": String(sid),
        "cid": "", 
        "date": new Date().toISOString().split('T')[0]
      };
      this.dataProvider.getStudentDetails(data).then((res: any) => {
        if (res && res.session && res.data) this.studentDetails = res.data; 
        resolve();
      }).catch(() => resolve());
    });
  }

  fetchStudentSkills(sid: any): Promise<void> {
    return new Promise((resolve) => {
      let body = { sid: String(sid) };
      this.dataProvider.getStudentSkillTree(body).then((res: any) => {
        if (res && res.success) {
          this.studentTotalPoints = res.total_points || 0;
          this.studentSkillData = res.skills;
        }
        resolve();
      }).catch(() => resolve());
    });
  }

  doRefresh(event) {
    let sid = this.userDetails.details.stu_id;
    this.loadAllDataSequentially(sid).then(() => {
      event.target.complete();
    });
  }

  async loadAllDataSequentially(sid: any) {
    this.isLoadingData = true;

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
      console.error("Error loading data", error);
    } finally {
      this.isLoadingData = false;
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

  fetchInventory(sid: any): Promise<void> {
    return new Promise((resolve) => {
      let body = { sid: String(sid), userId: String(this.userDetails.details.user_no) };
      this.gamificationApi.getStudentInventory(body).then((res: any) => {
        if (res && res.success) {
          let rawWallet = res.wallet || (res.data && res.data.wallet) || {};
          this.studentWallet = Array.isArray(rawWallet) ? (rawWallet[0] || {}) : rawWallet;
          this.unlockedTitles = res.unlocked_titles || [];
          this.unlockedBadges = res.unlocked_badges || [];
          this.activeCraftedTitle = res.active_title || null;

          this.alchemyTitlesList = this.gamification.processTitles(this.unlockedTitles);
          this.secretBadgesList = this.gamification.processBadges(this.unlockedBadges);
          
          this.studentTitle = this.gamification.getFinalStudentTitle(this.activeCraftedTitle, this.studentSkillData, this.studentTotalPoints);
        }
        resolve();
      }).catch(() => resolve());
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

  generateStudentTitle(skills: any, total: number) {
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
      case 'cognitive': return '💡 عبقري المستقبل';
      case 'social': return '🤝 روح الفريق';
      case 'discipline': return '🛡️ درع الانضباط';
      case 'emotional': return '❤️ القلب الكبير';
      case 'practical': return '💻 المبدع الرقمي';
      default: return '🌟 نجم المشاركة';
    }
  }

  canCraft(cost: any): boolean {
    if(!this.studentWallet || Object.keys(this.studentWallet).length === 0) return false;
    
    for (let skill in cost) {
      let spendableAmount = Number(this.studentWallet['spendable_' + skill]) || 0;
      if (spendableAmount < cost[skill]) return false;
    }
    return true; 
  }

  async craftTitle(title: any) {
    if(!this.canCraft(title.cost)) {
      this.dataProvider.showToast('عفواً، نقاطك لا تكفي لدمج هذا اللقب.'); return;
    }
    let sid = this.userDetails.details.stu_id;

    let body = {
      sid: String(sid),
      title_code: title.code,
      cost: JSON.stringify(title.cost),
      userId: String(this.userDetails.details.user_no)
    };

    try {
      let res: any = await this.dataProvider.run(() => this.gamificationApi.craftSkillTitle(body));
      if (res.success) {
        this.dataProvider.showToast(res.msg);
        await this.fetchInventory(sid);

        // 🟢 4. استدعاء هذه الدالة إجباري لكي تتحدث حالة الأزرار في الواجهة (من دمج إلى استخدام)
        this.mapDataToUI();

      } else {
        this.dataProvider.errorALertMessage(res.msg);
      }
    } catch(e) {
      this.dataProvider.showToast('حدث خطأ في الاتصال، يرجى المحاولة لاحقاً.');
    }
  }

  async toggleTitle(titleCode: string | null) {
    let sid = this.userDetails.details.stu_id;

    let body = {
      sid: String(sid),
      title_code: titleCode ? String(titleCode) : '',
      userId: String(this.userDetails.details.user_no)
    };

    try {
      let res: any = await this.dataProvider.run(() => this.gamificationApi.equipTitle(body));
      if (res.success) {
        this.activeCraftedTitle = titleCode;
        this.dataProvider.showToast(res.msg);
        this.updateStudentTitle();
      }
    } catch(e) {
      this.dataProvider.showToast('حدث خطأ في الاتصال، يرجى المحاولة لاحقاً.');
    }
  }

  openParentConnect() {
    this.router.navigate(['tabs/parentconnect']);
  }
}