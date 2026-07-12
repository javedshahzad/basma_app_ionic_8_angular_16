import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataService } from '../service/data/data.service';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';  

@Component({
  selector: 'app-add-parent',
  templateUrl: './add-parent.page.html',
  styleUrls: ['./add-parent.page.scss'],
})
export class AddParentPage implements OnInit {
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
  
  constructor(
    public formBuilder: FormBuilder,
    public dataProvider: DataService,
    public translate: TranslateService,
    private router: Router,
  ) { 
    this.translate.get("alertmessages").subscribe((res)=>{
      this.lang = res;
    });
    this.translate.get("reg_parent").subscribe((res)=>{
      this.lang1 = res;
    });
  }

  ngOnInit() {
    this.parentForm = this.formBuilder.group({
      parentID: ['', Validators.required],
      parentName: ['', Validators.required],
      parentPassword: ['', [Validators.required]],
      selected_student: [[], [Validators.required]], // تم تعديله ليكون مصفوفة افتراضياً
    });

    this.userdata = JSON.parse(localStorage.getItem("userloggedin"));
    this.getStudents();
  }

  get f() { return this.parentForm.controls; }

  // 🟢 جلب الأبناء/الطلاب من السيرفر
  getStudents(){
    this.isFetchingStudents = true;
  	let data={
  		'school_id': this.userdata.details.school_id
  	}
    this.dataProvider.getSchoolStudents(data).then(res => {
      this.isFetchingStudents = false;
      if(res.data){
        this.students = res.data;
        this.filteredStudents = [...this.students];
      }       
    }).catch(error=>{
      this.isFetchingStudents = false;
      this.dataProvider.showToast(error);
      console.log(error);
    })
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
      this.filteredStudents = this.students.filter(s => 
        s.name && s.name.toLowerCase().includes(query)
      );
    }
  }

  isStudentSelected(student: any): boolean {
    let currentSelection = this.f['selected_student'].value || [];
    return currentSelection.some((s: any) => s.sid === student.sid);
  }

  toggleStudent(student: any) {
    let currentSelection = [...(this.f['selected_student'].value || [])];
    const index = currentSelection.findIndex((s: any) => s.sid === student.sid);
    
    if (index > -1) {
      currentSelection.splice(index, 1);
    } else {
      currentSelection.push(student);
    }
    
    // تحديث قيمة الـ FormGroup
    this.parentForm.patchValue({ selected_student: currentSelection });
    this.parentForm.get('selected_student').markAsTouched();
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
      
      // تحديث قيمة الـ Form وعكس التغيير على الواجهة
      this.parentForm.patchValue({ selected_student: currentSelection });
      this.parentForm.get('selected_student').markAsTouched();
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
    
    if(this.parentForm.invalid || this.f['selected_student'].value.length === 0) {
        this.dataProvider.showToast('الرجاء تعبئة جميع الحقول المطلوبة');
        return;
    } else {
      this.signUpData = {
        "parentID" : this.f['parentID'].value,
        "parentName" : this.f['parentName'].value,
        "password" : this.f['parentPassword'].value,
        "selected_students" : JSON.stringify(this.f['selected_student'].value),
        "school_id" : this.userdata.details.school_id,
        "user_no" : this.userdata.details.user_no
      }

      this.show_loading = true; 
      
      this.dataProvider.createNewParent(this.signUpData).then((response)=>{
        this.show_loading = false;
        this.dataProvider.showToast(response);
        
        // 🟢 إرسال إشارة صريحة للقائمة بأن هناك بيانات جديدة يجب تحميلها
        const navigationExtras = {
          state: { isUpdated: true }
        };
        this.router.navigate(['requested-parent'], navigationExtras);
        
      }).catch((err)=>{
        this.show_loading = false;
        this.dataProvider.errorALertMessage(err);
      });
    }
  }

  _keyPress(event: any) {
    var charCode = (event.which) ? event.which : event.keyCode
    if (charCode > 31 && (charCode < 48 || charCode > 57))
      return false;
    return true;
  }
}