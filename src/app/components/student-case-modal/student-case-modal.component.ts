import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { StorageService } from '../../service/storage.service';
import { DataService } from '../../service/data/data.service';
import { PermissionService } from '../../service/permission/permission.service';
import { UserType } from '../../constants/user-type';
import { SchoolDirectoryApiService, SchoolUser } from '../../service/school-directory-api/school-directory-api.service';
import {
  StudentCasesApiService,
  CaseTypeOption,
  CaseListRow,
  CaseDetail,
  CaseSpecialistRow
} from '../../service/student-cases-api/student-cases-api.service';

type ViewState = 'list' | 'new' | 'detail';
type DetailTab = 'overview' | 'followup' | 'referral' | 'close';

/**
 * خطة إدارة حالات الطلاب — Phase 2. List → select case → follow-up/referral/
 * closure tabs. A separate, standalone modal (not an edit to
 * StudentDetailsComponent), opened from a second entry-point button next to
 * the ID-card button on the student details page. Confidentiality is
 * enforced server-side (StudentCasesService) — this component only ever
 * renders what the API actually returned, it doesn't make its own access
 * decisions.
 */
@Component({
  selector: 'app-student-case-modal',
  templateUrl: './student-case-modal.component.html',
  styleUrls: ['./student-case-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, CommonModule, TranslateModule, FormsModule]
})
export class StudentCaseModalComponent implements OnInit {
  @Input() student: any;

  readonly UserType = UserType;

  view: ViewState = 'list';
  detailTab: DetailTab = 'overview';
  loading = false;

  cases: CaseListRow[] = [];
  caseTypes: CaseTypeOption[] = [];
  specialists: CaseSpecialistRow[] = [];
  selectedCase: CaseDetail | null = null;

  // New-case form
  newCaseTypeId: number | null = null;
  newSummary = '';
  newConfidentiality: 'standard' | 'restricted' = 'standard';

  // Follow-up form
  followUpType: 'note' | 'parent_contact' | 'meeting' | 'referral_note' = 'note';
  followUpDescription = '';
  followUpPhone = '';

  // Referral / close forms
  referralReason = '';
  closureOutcome = '';

  // Specialist assignment
  selectedSpecialistUserNo: number | null = null;

  // Moderator access exception (restricted cases only, Admin or the case's
  // own specialist can manage this — never the moderator themselves).
  moderators: SchoolUser[] = [];
  selectedModeratorUserNo: number | null = null;

  private userNo: string | number = '';
  private sessionId = '';
  private schoolId: string | number = '';

  get isAdmin(): boolean {
    return this.permissionService.hasRole(UserType.Admin);
  }

  get isSpecialistOfSelectedCase(): boolean {
    return !!this.selectedCase && Number(this.selectedCase.assigned_specialist_id) === Number(this.userNo);
  }

  constructor(
    public modalController: ModalController,
    public translate: TranslateService,
    private storageSr: StorageService,
    private dataProvider: DataService,
    private permissionService: PermissionService,
    private casesApi: StudentCasesApiService,
    private schoolDirectoryApi: SchoolDirectoryApiService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const userDetails: any = await this.storageSr.get('userloggedin');
    this.userNo = userDetails?.details?.user_no ?? '';
    this.sessionId = userDetails?.session_id ?? '';
    this.schoolId = userDetails?.details?.school_id ?? '';
    await this.loadCases();
  }

  closeModal() {
    this.modalController.dismiss();
  }

  private baseParams(): Record<string, unknown> {
    return { user_no: this.userNo, session_id: this.sessionId, school_id: this.schoolId };
  }

  async loadCases() {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      this.cases = await this.casesApi.getStudentCases({ ...this.baseParams(), sid: this.student?.sid });
    } catch (error: any) {
      this.dataProvider.showToast(typeof error === 'string' ? error : error?.message || '');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async goToNewCase() {
    this.newCaseTypeId = null;
    this.newSummary = '';
    this.newConfidentiality = 'standard';
    this.view = 'new';
    this.cdr.markForCheck();

    if (this.caseTypes.length === 0) {
      try {
        this.caseTypes = await this.casesApi.getCaseTypes(this.baseParams());
        this.cdr.markForCheck();
      } catch (error: any) {
        this.dataProvider.showToast(typeof error === 'string' ? error : error?.message || '');
      }
    }
  }

  backToList() {
    this.view = 'list';
    this.selectedCase = null;
    this.cdr.markForCheck();
    this.loadCases();
  }

  async submitNewCase() {
    if (!this.newCaseTypeId) {
      this.dataProvider.showToast(this.translate.instant('student-cases.select_type_required'));
      return;
    }
    this.loading = true;
    this.cdr.markForCheck();
    try {
      const result = await this.casesApi.openStudentCase({
        ...this.baseParams(),
        sid: this.student?.sid,
        case_type_id: this.newCaseTypeId,
        summary: this.newSummary || undefined,
        confidentiality: this.newConfidentiality
      });
      this.dataProvider.showToast(this.translate.instant('student-cases.case_opened'));
      await this.openCaseDetail(result.case_id);
    } catch (error: any) {
      this.dataProvider.showToast(typeof error === 'string' ? error : error?.message || '');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async openCaseDetail(caseId: number) {
    this.loading = true;
    this.cdr.markForCheck();
    try {
      this.selectedCase = await this.casesApi.getCaseDetail({ ...this.baseParams(), case_id: caseId });
      this.detailTab = 'overview';
      this.view = 'detail';
      this.followUpType = 'note';
      this.followUpDescription = '';
      this.followUpPhone = this.student?.phone_no || '';
      this.referralReason = '';
      this.closureOutcome = '';
      await this.loadSpecialistsForSelectedCase();
      if (this.selectedCase.confidentiality === 'restricted' && (this.isAdmin || this.isSpecialistOfSelectedCase)) {
        await this.loadModerators();
      }
    } catch (error: any) {
      this.dataProvider.showToast(typeof error === 'string' ? error : error?.message || '');
      this.view = 'list';
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  private async loadSpecialistsForSelectedCase() {
    if (!this.selectedCase?.case_type) return;
    try {
      this.specialists = await this.casesApi.getCaseSpecialists({
        ...this.baseParams(),
        case_type_id: this.selectedCase.case_type.id
      });
      this.cdr.markForCheck();
    } catch {
      // Non-critical for viewing the case itself — the picker just stays empty.
    }
  }

  onFollowUpTypeChange() {
    if (this.followUpType === 'parent_contact' && !this.followUpPhone) {
      this.followUpPhone = this.student?.phone_no || this.student?.phone_no_two || '';
    }
  }

  async submitFollowup() {
    if (!this.selectedCase || !this.followUpDescription.trim()) {
      this.dataProvider.showToast(this.translate.instant('student-cases.description_required'));
      return;
    }
    this.loading = true;
    this.cdr.markForCheck();
    try {
      await this.casesApi.addCaseFollowup({
        ...this.baseParams(),
        case_id: this.selectedCase.case_id,
        follow_up_type: this.followUpType,
        description: this.followUpDescription,
        contact_phone: this.followUpType === 'parent_contact' ? this.followUpPhone : undefined
      });
      this.followUpDescription = '';
      this.dataProvider.showToast(this.translate.instant('student-cases.followup_added'));
      await this.openCaseDetail(this.selectedCase.case_id);
    } catch (error: any) {
      this.dataProvider.showToast(typeof error === 'string' ? error : error?.message || '');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async submitReferral() {
    if (!this.selectedCase || !this.referralReason.trim()) {
      this.dataProvider.showToast(this.translate.instant('student-cases.reason_required'));
      return;
    }
    this.loading = true;
    this.cdr.markForCheck();
    try {
      await this.casesApi.referStudentCase({
        ...this.baseParams(),
        case_id: this.selectedCase.case_id,
        reason: this.referralReason
      });
      this.referralReason = '';
      this.dataProvider.showToast(this.translate.instant('student-cases.case_referred'));
      await this.openCaseDetail(this.selectedCase.case_id);
    } catch (error: any) {
      this.dataProvider.showToast(typeof error === 'string' ? error : error?.message || '');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async submitClose() {
    if (!this.selectedCase) return;
    this.loading = true;
    this.cdr.markForCheck();
    try {
      await this.casesApi.closeStudentCase({
        ...this.baseParams(),
        case_id: this.selectedCase.case_id,
        closure_outcome: this.closureOutcome || undefined
      });
      this.dataProvider.showToast(this.translate.instant('student-cases.case_closed'));
      await this.openCaseDetail(this.selectedCase.case_id);
    } catch (error: any) {
      this.dataProvider.showToast(typeof error === 'string' ? error : error?.message || '');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async assignSpecialist() {
    if (!this.selectedCase || !this.selectedSpecialistUserNo) return;
    this.loading = true;
    this.cdr.markForCheck();
    try {
      await this.casesApi.assignCaseSpecialist({
        ...this.baseParams(),
        case_id: this.selectedCase.case_id,
        specialist_user_no: this.selectedSpecialistUserNo
      });
      this.dataProvider.showToast(this.translate.instant('student-cases.specialist_assigned'));
      await this.openCaseDetail(this.selectedCase.case_id);
    } catch (error: any) {
      this.dataProvider.showToast(typeof error === 'string' ? error : error?.message || '');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  statusLabel(status: string): string {
    return this.translate.instant('student-cases.status_' + status);
  }

  /** name_ar/name_en were always rendered as name_ar regardless of the
   * active UI language -- this picks the right one live off the current
   * translate language instead of a fixed field. */
  caseTypeName(type: { name_ar?: string; name_en?: string } | null | undefined): string {
    if (!type) return '';
    return this.translate.currentLang === 'en' ? type.name_en || type.name_ar || '' : type.name_ar || type.name_en || '';
  }

  private async loadModerators() {
    try {
      const res = await this.schoolDirectoryApi.getAllUsers({ ...this.baseParams() });
      this.moderators = (res.data || []).filter(u => String(u['user_type']) === UserType.Moderator);
      this.cdr.markForCheck();
    } catch {
      // Non-critical for viewing the case itself — the grant control just stays empty.
    }
  }

  isModeratorGranted(userNo: string | number): boolean {
    return !!this.selectedCase?.moderator_grants?.some(g => Number(g.user_no) === Number(userNo));
  }

  async grantModeratorAccess() {
    if (!this.selectedCase || !this.selectedModeratorUserNo) return;
    this.loading = true;
    this.cdr.markForCheck();
    try {
      await this.casesApi.grantCaseModeratorAccess({
        ...this.baseParams(),
        case_id: this.selectedCase.case_id,
        moderator_user_no: this.selectedModeratorUserNo
      });
      this.selectedModeratorUserNo = null;
      this.dataProvider.showToast(this.translate.instant('student-cases.access_granted'));
      await this.openCaseDetail(this.selectedCase.case_id);
    } catch (error: any) {
      this.dataProvider.showToast(typeof error === 'string' ? error : error?.message || '');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  async revokeModeratorAccess(userNo: string | number) {
    if (!this.selectedCase) return;
    this.loading = true;
    this.cdr.markForCheck();
    try {
      await this.casesApi.revokeCaseModeratorAccess({
        ...this.baseParams(),
        case_id: this.selectedCase.case_id,
        moderator_user_no: userNo
      });
      this.dataProvider.showToast(this.translate.instant('student-cases.access_revoked'));
      await this.openCaseDetail(this.selectedCase.case_id);
    } catch (error: any) {
      this.dataProvider.showToast(typeof error === 'string' ? error : error?.message || '');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }
}
