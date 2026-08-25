import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { DataService } from '../service/data/data.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { ParentManagementApiService } from '../service/parent-management-api/parent-management-api.service';
import { StorageService } from '../service/storage.service';
import { SchoolDirectoryApiService } from '../service/school-directory-api/school-directory-api.service';
import { NgClass, NgIf, NgFor } from '@angular/common';

@Component({
    selector: 'app-add-parent',
    templateUrl: './add-parent.page.html',
    styleUrls: ['./add-parent.page.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [IonicModule, FormsModule, ReactiveFormsModule, NgClass, NgIf, NgFor, TranslatePipe]
})
export class AddParentPage implements OnInit {
  trackByIndex(index: number): number {
    return index;
  }
  userdata: any;
  parentForm: FormGroup;
  submitted: boolean = false;
  signUpData: any;
  students: any = [];
  lang: any;
  lang1: any;
  show_loading: boolean = false;

  // --- متغيرات النافذة الذكية لاختيار الأبناء ---
  isStudentModalOpen: boolean = false;
  studentSearchQuery: string = '';
  filteredStudents: any[] = [];
  isFetchingStudents: boolean = false;
  // Mirrors selected_student's ids for O(1) isStudentSelected() lookups in
  // the *ngFor row template instead of scanning the selection array per row
  // per change-detection cycle; kept in sync at every mutation site below.
  selectedStudentIds = new Set<string | number>();

  constructor(
    public formBuilder: FormBuilder,
    public dataProvider: DataService,
    public translate: TranslateService,
    private router: Router,
    private parentManagementApi: ParentManagementApiService,
    private storageSr: StorageService,
    private schoolDirectoryApi: SchoolDirectoryApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.translate.get('alertmessages').subscribe(res => {
      this.lang = res;
      this.cdr.markForCheck();
    });
    this.translate.get('reg_parent').subscribe(res => {
      this.lang1 = res;
      this.cdr.markForCheck();
    });
  }

  async ngOnInit() {
    this.parentForm = this.formBuilder.group({
      parentID: ['', Validators.required],
      parentName: ['', Validators.required],
      parentPassword: ['', [Validators.required]],
      selected_student: [[], [Validators.required]] // تم تعديله ليكون مصفوفة افتراضياً
    });

    this.userdata = await this.storageSr.get('userloggedin');
    if (this.userdata) {
      this.getStudents();
    } else {
      this.router.navigate(['login'], { replaceUrl: true });
    }
    this.cdr.markForCheck();
  }

  get f() {
    return this.parentForm.controls;
  }

  // 🟢 جلب الأبناء/الطلاب من السيرفر
  getStudents() {
    this.isFetchingStudents = true;
    let data = {
      school_id: this.userdata.details.school_id
    };
    this.schoolDirectoryApi
      .getSchoolStudents(data)
      .then(res => {
        this.isFetchingStudents = false;
        if (res.data) {
          this.students = res.data;
          this.filteredStudents = [...this.students];
        }
        this.cdr.markForCheck();
      })
      .catch(error => {
        this.isFetchingStudents = false;
        this.dataProvider.showToast(error);
        console.log(error);
        this.cdr.markForCheck();
      });
  }

  // =====================================
  // 🟢 دوال النافذة الذكية لاختيار الأبناء
  // =====================================
  openStudentModal() {
    this.filteredStudents = [...this.students];
    this.studentSearchQuery = '';
    this.isStudentModalOpen = true;
  }

  filterStudents() {
    if (!this.studentSearchQuery || this.studentSearchQuery.trim() === '') {
      this.filteredStudents = [...this.students];
    } else {
      const query = this.studentSearchQuery.toLowerCase();
      this.filteredStudents = this.students.filter((s: any) => s.name && s.name.toLowerCase().includes(query));
    }
  }

  isStudentSelected(student: any): boolean {
    return this.selectedStudentIds.has(student.sid);
  }

  toggleStudent(student: any) {
    let currentSelection = [...(this.f['selected_student'].value || [])];
    const index = currentSelection.findIndex((s: any) => s.sid === student.sid);

    if (index > -1) {
      currentSelection.splice(index, 1);
      this.selectedStudentIds.delete(student.sid);
    } else {
      currentSelection.push(student);
      this.selectedStudentIds.add(student.sid);
    }

    // تحديث قيمة الـ FormGroup
    this.parentForm.patchValue({ selected_student: currentSelection });
    this.parentForm.get('selected_student')?.markAsTouched();
  }

  // =====================================
  // 🟢 دالة إزالة الطالب من الواجهة مباشرة
  // =====================================
  removeStudent(student: any, event: Event) {
    // إيقاف الحدث حتى لا يتم فتح النافذة بالخطأ عند الضغط على زر الحذف
    event.stopPropagation();

    // جلب القائمة الحالية للطلاب المحددين
    let currentSelection = [...(this.f['selected_student'].value || [])];

    // البحث عن الطالب المراد حذفه
    const index = currentSelection.findIndex((s: any) => s.sid === student.sid);

    if (index > -1) {
      currentSelection.splice(index, 1); // حذفه من المصفوفة
      this.selectedStudentIds.delete(student.sid);

      // تحديث قيمة الـ Form وعكس التغيير على الواجهة
      this.parentForm.patchValue({ selected_student: currentSelection });
      this.parentForm.get('selected_student')?.markAsTouched();
    }
  }

  getSelectedStudentsText(): string {
    let currentSelection = this.f['selected_student'].value || [];
    if (currentSelection.length === 0) {
      return 'اضغط لتحديد الأبناء...';
    }
    if (currentSelection.length === 1) {
      return currentSelection[0].name;
    }
    return `تم تحديد (${currentSelection.length}) من الأبناء`;
  }

  // =====================================
  // 🟢 إرسال البيانات
  // =====================================
  onSubmit() {
    this.submitted = true;

    if (this.parentForm.invalid || this.f['selected_student'].value.length === 0) {
      this.dataProvider.showToast('الرجاء تعبئة جميع الحقول المطلوبة');
      return;
    } else {
      this.signUpData = {
        parentID: this.f['parentID'].value,
        parentName: this.f['parentName'].value,
        password: this.f['parentPassword'].value,
        selected_students: JSON.stringify(this.f['selected_student'].value),
        school_id: this.userdata.details.school_id,
        user_no: this.userdata.details.user_no
      };

      this.show_loading = true;

      this.parentManagementApi
        .createNewParent(this.signUpData)
        .then(response => {
          this.show_loading = false;
          this.dataProvider.showToast(response);

          // 🟢 إرسال إشارة صريحة للقائمة بأن هناك بيانات جديدة يجب تحميلها
          const navigationExtras = {
            state: { isUpdated: true }
          };
          this.router.navigate(['requested-parent'], navigationExtras);
          this.cdr.markForCheck();
        })
        .catch(err => {
          this.show_loading = false;
          this.dataProvider.errorALertMessage(err);
          this.cdr.markForCheck();
        });
    }
  }

  _keyPress(event: any) {
    var charCode = event.which ? event.which : event.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) return false;
    return true;
  }
}
