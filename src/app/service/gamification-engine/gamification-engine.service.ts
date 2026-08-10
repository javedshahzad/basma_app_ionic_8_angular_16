import { Injectable } from '@angular/core';
import { ALCHEMY_TITLES } from '../../constants/alchemy-titles';
import { SECRET_BADGES } from '../../constants/secret-badges';
import { SkillData } from '../gamification-api/gamification-api.service';
import { Student } from '../../model/student.model';

// Only the two ranking fields the behaviour engine actually reads — kept
// separate from Student so callers with a narrower record (e.g. follow-up's
// FollowupStudentRecord, which has no ranking fields) still satisfy it
// structurally instead of needing the full Student shape.
export interface RankedRecord {
  agg_ranking?: number;
  ranking?: number;
}

export interface ProcessedTitle {
  code: string;
  name: string;
  icon: string;
  color: string;
  bg: string;
  border: string;
  desc: string;
  cost: { cognitive?: number; social?: number; discipline?: number; emotional?: number; practical?: number };
  isUnlocked: boolean;
}

export interface ProcessedBadge {
  code: string;
  name: string;
  icon: string;
  hint: string;
  unlockedDesc: string;
  isUnlocked: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class GamificationEngineService {

  constructor() { }

  // =========================================
  // 1. محرك الألقاب (Titles Engine)
  // =========================================

  // دمج الألقاب الثابتة وفرزها (المفتوح أولاً)
  processTitles(unlockedTitleCodes: string[]): ProcessedTitle[] {
    const unlocked = unlockedTitleCodes || [];
    return ALCHEMY_TITLES.map(title => ({
      ...title,
      isUnlocked: unlocked.includes(title.code)
    })).sort((a, b) => (b.isUnlocked ? 1 : 0) - (a.isUnlocked ? 1 : 0));
  }

  // حساب اللقب الافتراضي بناءً على المهارات
  generateDefaultTitle(skills: SkillData | Student | null | undefined, totalPoints: number): string {
    if (!skills || totalPoints === 0) return '🌱 بطل في البداية';

    let highestSkill = 'general';
    let maxPoints = 0;

    const skillMap = {
      cognitive: Number(skills?.cognitive || 0),
      social: Number(skills?.social || 0),
      discipline: Number(skills?.discipline || 0),
      emotional: Number(skills?.emotional || 0),
      practical: Number(skills?.practical || 0)
    };

    for (const [skill, points] of Object.entries(skillMap)) {
      if (points > maxPoints) {
        maxPoints = points;
        highestSkill = skill;
      }
    }

    if (maxPoints === 0) return '🌱 بطل في البداية';

    switch (highestSkill) {
      case 'cognitive': return '💡 عبقري المستقبل';
      case 'social': return '🤝 روح الفريق';
      case 'discipline': return '🛡️ درع الانضباط';
      case 'emotional': return '❤️ القلب الكبير';
      case 'practical': return '💻 المبدع الرقمي';
      default: return '🌟 نجم المشاركة';
    }
  }

  // جلب اللقب النهائي (يفحص اللقب المفعل أولاً، وإلا يعطي الافتراضي)
  getFinalStudentTitle(activeTitleCode: string, skillsData: SkillData | Student | null | undefined, totalPoints: number): string {
    if (activeTitleCode) {
      const matchedTitle = ALCHEMY_TITLES.find(t => t.code === activeTitleCode);
      if (matchedTitle) {
        return matchedTitle.icon + ' ' + matchedTitle.name;
      }
    }
    return this.generateDefaultTitle(skillsData, totalPoints);
  }

  // =========================================
  // 2. محرك الأوسمة السرية (Badges Engine)
  // =========================================

  // دمج الأوسمة الثابتة وفرزها (المفتوح أولاً)
  processBadges(unlockedBadgeCodes: string[]): ProcessedBadge[] {
    const unlocked = unlockedBadgeCodes || [];
    return SECRET_BADGES.map(badge => ({
      ...badge,
      isUnlocked: unlocked.includes(badge.code)
    })).sort((a, b) => (b.isUnlocked ? 1 : 0) - (a.isUnlocked ? 1 : 0));
  }

  // حساب نسبة التقدم في الأوسمة
  calculateBadgesProgress(unlockedBadgeCodes: string[]): number {
    const unlocked = unlockedBadgeCodes || [];
    const totalBadges = SECRET_BADGES.length;
    if (totalBadges === 0) return 0;
    return (unlocked.length / totalBadges); // يرجع رقم من 0 إلى 1 (مثلاً 0.25)
  }

  // =========================================
  // 3. محرك تقييم السلوك المركزي (Behavior Engine)
  // =========================================

  // 🟢 استخراج الرقم الموحد (يعالج التضارب بين المعلم وولي الأمر)
  // Accepts `unknown` (not RankedRecord directly) because callers pass
  // genuinely unrelated record types — e.g. FollowupStudentRecord, which
  // has no index signature and shares zero declared fields with
  // RankedRecord — that neither a weak-type nor a Record<string, unknown>
  // parameter would accept structurally.
  getValidRank(studentRaw: unknown): number {
    if (!studentRaw) return 0;
    const student = studentRaw as RankedRecord;

    // 🟢 التعديل هنا: وضعنا agg_ranking في البداية لكي يكون هو الحاكم المطلق لتقييم الطالب
    let rank = Number(student.agg_ranking || student.ranking || 0);

    // إذا كان الناتج ليس رقماً (NaN) أو أقل من أو يساوي الصفر، نرجعه 0 فوراً
    if (isNaN(rank) || rank <= 0) return 0;

    return rank;
  }

  // 🟢 1. جلب نص المستوى
  getStudentBehaviourText(student: unknown, langObj?: Record<string, string>): string {
    const rank = this.getValidRank(student);
    if (rank === 0) return langObj?.no_behaviour || 'لا يوجد تقييم';

    if (rank < 2.6) return langObj?.warning_behaviour || 'الطالب/ه يحتاج لمتابعة';
    if (rank < 3.6) return langObj?.good_behaviour || 'مستوى الطالب/ه جيد';
    if (rank < 4.6) return langObj?.very_good_behaviour || 'مستوى الطالب/ه جيد جداً';
    return langObj?.excellent_behaviour || 'مستوى الطالب/ه ممتاز';
  }

  // 🟢 2. جلب لون المستوى
  getBehaviourColorClass(student: unknown): string {
    const rank = this.getValidRank(student);
    if (rank === 0) return 'text-slate-400';
    if (rank < 2.6) return 'text-rose-500';
    if (rank < 3.6) return 'text-amber-500';
    if (rank < 4.6) return 'text-indigo-600';
    return 'text-emerald-500';
  }

  // 🟢 3. جلب أيقونة المستوى
  getBehaviourIcon(student: unknown): string {
    const rank = this.getValidRank(student);
    return rank > 0 ? 'trending-up' : 'remove-circle-outline';
  }
}