import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { DataService } from '../../service/data/data.service';
import { readSheet, InvalidInputError } from 'read-excel-file/browser';

export interface ImportRow {
  name: string;
  /** null means "no cid provided for this row" — auto-generated at import time, same as leaving Student ID blank in the single-add flow. */
  student_id: number | null;
}

interface InvalidRow {
  rowNumber: number;
  reason: string;
}

@Component({
  selector: 'app-import-students-modal',
  templateUrl: './import-students-modal.component.html',
  imports: [IonicModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ImportStudentsModalComponent {
  @Input() importLang: any;

  fileName: string | null = null;
  isParsing = false;
  validRows: ImportRow[] = [];
  invalidRows: InvalidRow[] = [];
  parseError: string | null = null;

  constructor(
    private modalCtrl: ModalController,
    private dataProvider: DataService,
    private cdr: ChangeDetectorRef
  ) {}

  hideModal() {
    this.modalCtrl.dismiss();
  }

  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.fileName = file.name;
    this.isParsing = true;
    this.validRows = [];
    this.invalidRows = [];
    this.parseError = null;
    this.cdr.markForCheck();

    try {
      const { validRows, invalidRows } = await this.parseWorkbook(file);
      this.validRows = validRows;
      this.invalidRows = invalidRows;
    } catch (error) {
      if (error instanceof InvalidInputError && error.code === 'XLS_FILE_NOT_SUPPORTED') {
        this.parseError = this.importLang?.xls_not_supported || 'صيغة .xls القديمة غير مدعومة. يرجى حفظ الملف بصيغة .xlsx ثم إعادة المحاولة.';
      } else {
        this.parseError = this.importLang?.parse_error || 'تعذّرت قراءة الملف. تأكد أنه ملف إكسل صالح.';
      }
    } finally {
      this.isParsing = false;
      this.cdr.markForCheck();
      input.value = '';
    }
  }

  private async parseWorkbook(file: File): Promise<{ validRows: ImportRow[]; invalidRows: InvalidRow[] }> {
    const rows = await readSheet(file);
    if (rows.length === 0) throw new Error('empty file');

    const header = rows[0].map(cell => String(cell ?? '').trim().toLowerCase());
    const nameCol = header.indexOf('full_name');
    // cid is optional — a missing column just means every row falls back to
    // auto-generation, same as the -1-sentinel makes every row's idRaw below
    // resolve to '' unconditionally.
    const idCol = header.indexOf('cid');

    if (nameCol === -1) {
      throw new Error('missing required column');
    }

    const validRows: ImportRow[] = [];
    const invalidRows: InvalidRow[] = [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 1; // 1-based, matching what a spreadsheet user sees
      const name = String(row[nameCol] ?? '').trim();
      const idRaw = idCol === -1 ? '' : String(row[idCol] ?? '').trim();

      if (!name && !idRaw) continue; // skip fully blank rows

      if (!name) {
        invalidRows.push({ rowNumber, reason: this.importLang?.row_missing_name || 'الاسم مفقود' });
        continue;
      }

      if (idRaw === '') {
        // No cid for this row — not an error, just means "auto-generate,"
        // exactly like leaving Student ID blank in the single-add modal.
        validRows.push({ name, student_id: null });
        continue;
      }

      const studentId = parseInt(idRaw, 10);
      if (!Number.isInteger(studentId) || studentId === 0) {
        invalidRows.push({ rowNumber, reason: this.importLang?.row_invalid_id || 'رقم الطالب غير صالح' });
        continue;
      }

      validRows.push({ name, student_id: studentId });
    }

    return { validRows, invalidRows };
  }

  confirm() {
    if (this.validRows.length === 0) return;
    this.modalCtrl.dismiss({ rows: this.validRows });
  }

  get validRowsLabel(): string {
    const template = this.importLang?.valid_rows_count || '{{count}} طالب جاهز للاستيراد';
    return template.replace('{{count}}', String(this.validRows.length));
  }

  get invalidRowsLabel(): string {
    const template = this.importLang?.invalid_rows_count || '{{count}} صف به مشكلة وسيتم تجاهله';
    return template.replace('{{count}}', String(this.invalidRows.length));
  }

  get autoIdCount(): number {
    return this.validRows.filter(row => row.student_id === null).length;
  }

  get autoIdLabel(): string {
    const template = this.importLang?.auto_id_rows_count || '{{count}} منهم بدون رقم الطالب وسيُنشأ له رقم فريد تلقائياً';
    return template.replace('{{count}}', String(this.autoIdCount));
  }
}
