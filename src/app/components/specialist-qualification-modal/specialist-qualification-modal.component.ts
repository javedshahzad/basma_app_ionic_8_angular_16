import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { StorageService } from '../../service/storage.service';
import { DataService } from '../../service/data/data.service';
import { StudentCasesApiService, CaseTypeOption } from '../../service/student-cases-api/student-cases-api.service';

/**
 * خطة إدارة حالات الطلاب Phase 3 — Admin-only. Reached from a per-row
 * action on the existing users-list page (Viewer-role rows only), not a
 * new top-level nav item, per the plan's own design. Manages which case
 * types one Viewer account ("مكتب الخدمة الاجتماعية والنفسية") is
 * qualified to handle — no new account type, just abs_case_specialists
 * rows via setCaseSpecialistQualification.
 */
@Component({
  selector: 'app-specialist-qualification-modal',
  templateUrl: './specialist-qualification-modal.component.html',
  styleUrls: ['./specialist-qualification-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IonicModule, CommonModule, TranslateModule]
})
export class SpecialistQualificationModalComponent implements OnInit {
  @Input() specialist: { user_no?: string | number; first_name?: string } = {};

  caseTypes: CaseTypeOption[] = [];
  qualifiedIds = new Set<number>();
  loading = false;
  savingId: number | null = null;

  private userNo: string | number = '';
  private sessionId = '';
  private schoolId: string | number = '';

  constructor(
    public modalController: ModalController,
    public translate: TranslateService,
    private storageSr: StorageService,
    private dataProvider: DataService,
    private casesApi: StudentCasesApiService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const userDetails: any = await this.storageSr.get('userloggedin');
    this.userNo = userDetails?.details?.user_no ?? '';
    this.sessionId = userDetails?.session_id ?? '';
    this.schoolId = userDetails?.details?.school_id ?? '';

    this.loading = true;
    this.cdr.markForCheck();
    try {
      const [caseTypes, specialists] = await Promise.all([
        this.casesApi.getCaseTypes(this.baseParams()),
        this.casesApi.getCaseSpecialists(this.baseParams())
      ]);
      this.caseTypes = caseTypes;
      const mine = specialists.find(s => Number(s.user_no) === Number(this.specialist.user_no));
      this.qualifiedIds = new Set(mine?.qualified_case_type_ids?.map(Number) || []);
    } catch (error: any) {
      this.dataProvider.showToast(typeof error === 'string' ? error : error?.message || '');
    } finally {
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  private baseParams(): Record<string, unknown> {
    return { user_no: this.userNo, session_id: this.sessionId, school_id: this.schoolId };
  }

  closeModal() {
    this.modalController.dismiss();
  }

  isQualified(caseTypeId: number): boolean {
    return this.qualifiedIds.has(caseTypeId);
  }

  async toggle(caseTypeId: number) {
    const wasQualified = this.qualifiedIds.has(caseTypeId);
    this.savingId = caseTypeId;
    this.cdr.markForCheck();
    try {
      await this.casesApi.setCaseSpecialistQualification({
        ...this.baseParams(),
        target_user_no: this.specialist.user_no,
        case_type_id: caseTypeId,
        is_qualified: !wasQualified
      });
      if (wasQualified) {
        this.qualifiedIds.delete(caseTypeId);
      } else {
        this.qualifiedIds.add(caseTypeId);
      }
      this.dataProvider.showToast(this.translate.instant('student-cases.qualification_updated'));
    } catch (error: any) {
      this.dataProvider.showToast(typeof error === 'string' ? error : error?.message || '');
    } finally {
      this.savingId = null;
      this.cdr.markForCheck();
    }
  }
}
