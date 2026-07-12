import { Component, OnInit, NgZone } from '@angular/core';
import { NavController, NavParams, AlertController, PopoverController, Platform, ModalController, ActionSheetController } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService, getFileReader } from '../service/data/data.service';
import { TranslateService } from '@ngx-translate/core';
import { Network } from '@awesome-cordova-plugins/network/ngx';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { DatabaseService } from '../service/database/database.service';
import { StudentDataService } from '../service/student-data/student-data.service';
import { environment } from '../../environments/environment';
import { Storage } from '@ionic/storage';
import { AddReviewComponent } from '../add-review/add-review.component';
import { Printer, PrintOptions } from '@awesome-cordova-plugins/printer/ngx';
import { StudentDetailsComponent } from '../components/student-details/student-details.component';
import { AvatarImagesComponent } from '../components/avatar-images/avatar-images.component';
import { Browser } from '@capacitor/browser';
import { ImageProcessingService } from '../service/image-processing/image-processing.service';

import { StudentOptionsPopoverComponent } from '../components/student-options-popover/student-options-popover.component';
import { ImageOptionPopoverComponent } from '../components/image-option-popover/image-option-popover.component'; 
import { PrintOptionsPopoverComponent } from '../components/print-options-popover/print-options-popover.component';
import { EditDeleteNotePopoverComponent } from '../components/edit-delete-note-popover/edit-delete-note-popover.component';

import { GamificationEngineService } from '../service/gamification-engine/gamification-engine.service';
import { SkillTreeModalComponent } from '../components/skill-tree-modal/skill-tree-modal.component';

const env = environment;

@Component({
  selector: 'app-student-detail',
  templateUrl: './student-detail.page.html',
  styleUrls: ['./student-detail.page.scss'],
})
export class StudentDetailPage implements OnInit {

  absenceDetail: any = []
  notes: any = [];
  category: string;
  studentDetails:any = {};
  userType:any;
  lang:any = {};
  userDetails:any = {};
  noteMessage:string = "";
  canAddStudentNote:boolean = true;
  noNotesFound:string = '';
  noAbsenceFound:string = '';
  selections:any = ['#04855f', '#eeeeee', '#eeeeee', '#eeeeee', '#eeeeee'];
  aggStars:any = ['#eeeeee', '#eeeeee', '#eeeeee', '#eeeeee', '#eeeeee'];
  ratingStars:any;
  showNoteModal:boolean = false;
  halfStar:boolean = false;
  halfStarPosition:number;
  studentBehaviour:any = {
    "icon": "",
    "text": ""
  }
  totalDelay:any;
  navData:any={};
  planLang:any;
  app_rate:any;
  student_detailse: any;
  student_points: any[] = [];
  id: any;
  callOfStudentsReport=[];
  AllStudentPledgesReports=[];
  AvailablePlan: any;
  editNoteData: any;

  showAbsenceNoteModal: boolean = false;
  absenceNoteText: string = "";
  currentAbsenceDate: any = null;
  currentAbsenceNotesArray: any = null;

  showDeleteConfirmModal: boolean = false;
  deletePayload: any = null;

  showImageViewer: boolean = false;
  viewImageUrl: string = '';

  isLoadingSkills: boolean = false;
  studentTotalPoints: number = 0;
  studentSkillData: any = null;
  studentTitle: string = '';
  skillMaxTarget: number = 100;
  
  isAbsenceLoaded: boolean = false; 
  isReportsLoaded: boolean = false;
  isNotesLoaded: boolean = false;

  processedTitles: any[] = [];
  processedBadges: any[] = [];
  badgesProgress: number = 0;

  showWarningPopup: boolean = false;
  warningMessage: string = '';
  warningType: 'frozen' | 'warning' = 'warning';

  constructor(public navCtrl: NavController, 
        public dataProvider: DataService,
        public authProvider: AuthService, 
        public dbProvider: DatabaseService,
        public studentService:StudentDataService,
        public alertController: AlertController,
        public translate: TranslateService,
        public alertCtrl: AlertController, 
        private printer: Printer,
        public network: Network,
        private route : ActivatedRoute,
        private router:Router,
        public zone:NgZone,
        private popover:PopoverController, 
        public platform: Platform,
        private storage: Storage,
        public modalController: ModalController,
        public actionSheetController: ActionSheetController,
        private imageService: ImageProcessingService,
        public gamification: GamificationEngineService,
        ) {
      
      // 🟢 الإصلاح الأول: صيد البيانات فوراً بدون التورط في subscribe لـ queryParams
      const navigation = this.router.getCurrentNavigation();
      if (navigation && navigation.extras && navigation.extras.state) {
           this.navData = navigation.extras.state;
           this.storage.set('currentStudent', this.navData);
           localStorage.setItem("currentStudent", JSON.stringify(this.navData));
           this.totalDelay = this.navData.total_delay;
      }
   
      this.translate.get("alertmessages").subscribe((val)=>{ this.lang = val; })
      this.translate.get("plan").subscribe((val)=>{ this.planLang = val; })
      this.translate.get("app_rate").subscribe((val)=>{ this.app_rate = val; })
      this.translate.get("student-details").subscribe((val)=>{ this.student_detailse = val; })
  }

  closeWarningPopup() {
    this.showWarningPopup = false;
  }

  async openSkillTreeModal() {
    const modal = await this.modalController.create({
      component: SkillTreeModalComponent,
      componentProps: { student: this.studentDetails }, 
      cssClass: 'bottom-drawer-modal', 
      breakpoints: [0, 0.6, 0.9],
      initialBreakpoint: 0.6,
      handle: true
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data) {
      this.awardSkillPoints(data.skillType, data.points);
    }
  }

  async awardSkillPoints(skillType: string, point: number) {
    this.dataProvider.showLoading();
    
    let formattedPoint = "+" + point; 

    let body = {
      sid: String(this.studentDetails.sid),
      userId: String(this.userDetails.details.user_no), 
      points: formattedPoint,
      skill_type: skillType
    };

    try {
      const res: any = await this.dataProvider.addStudentPoints(body);
      this.dataProvider.hideLoading();
      
      this.zone.run(() => {
        if (res && res.success) {
          this.dataProvider.showToast(`تمت إضافة ${point} نقطة بنجاح!`);
          
          if(this.studentDetails.student_points !== undefined) {
            this.studentDetails.student_points = Number(this.studentDetails.student_points) + point;
          } else {
            this.studentDetails.student_points = point;
          }
        } else {
          setTimeout(() => {
            let msg = res?.msg || 'تعذر إضافة النقاط';
            this.warningType = (this.isFrozen || msg.includes('مجم') || msg.includes('تجميد')) ? 'frozen' : 'warning';
            this.warningMessage = msg;
            this.showWarningPopup = true;
          }, 300);
        }
      });
    } catch (err: any) {
      this.dataProvider.hideLoading();
      
      this.zone.run(() => {
        setTimeout(() => {
          let errorDetails = typeof err === 'string' ? err : (err?.message || JSON.stringify(err));
          let msg = `خطأ: ${errorDetails}`;
          
          this.warningType = (this.isFrozen || msg.includes('مجم') || msg.includes('تجميد')) ? 'frozen' : 'warning';
          this.warningMessage = msg;
          this.showWarningPopup = true;
        }, 300);
      });
    }
  }

  sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  fetchStudentSkills(sid: any) {
    this.isLoadingSkills = true;
    this.studentTotalPoints = 0; 
    this.studentSkillData = null;
    this.studentTitle = 'جاري التحليل...';

    let body = { sid: sid };

    this.dataProvider.getStudentSkillTree(body).then((res: any) => {
      this.isLoadingSkills = false;
      if (res && res.success) {
        this.studentTotalPoints = res.total_points || 0;
        this.studentSkillData = res.skills;
        this.studentTitle = this.gamification.getFinalStudentTitle(this.activeCraftedTitle, res.skills, this.studentTotalPoints);
      } else {
        this.studentTitle = '🌱 بطل في البداية'; 
      }
    }).catch(err => {
      this.isLoadingSkills = false;
      this.studentTitle = '⚠️ تعذر جلب اللقب'; 
    });
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

  openFullscreenImage(url: string) {
    this.viewImageUrl = url;
    this.showImageViewer = true;
  }

  closeFullscreenImage() {
    this.showImageViewer = false;
    setTimeout(() => {
      this.viewImageUrl = '';
    }, 300);
  }

  getStudentPoints(){
    this.dataProvider.getPointsValue().then(res => {
     this.student_points = res.points;
    });   
   }

  ionViewWillEnter() {
   if(this.platform.is('cordova') || this.platform.is('capacitor')){
      if(this.network.type != this.network.Connection.NONE && this.network.type != this.network.Connection.UNKNOWN){
        this.checkProfile();
      }else{
        if(this.navData.student_id){
          this.getOfflineNote();
          this.studentService.getStudent(this.navData.student_id,response=>{
            this.studentDetails = response;
           
              if(this.studentDetails.can_view_absent){
                this.category = "absence";
              }else{
                this.category = "notes";
              }
              if(this.userType == '2'){
                this.category = "notes";
              }
              if(this.studentDetails.absents.length == 0){
                this.noAbsenceFound = this.lang.no_absent;
              }
          },error=>{
            this.dataProvider.showToast(this.lang.no_internet);
          })
        }else{
            this.dataProvider.showToast(this.lang.no_internet); 
          this.navCtrl.back();
        }
      }
    }else{
      this.checkProfile();
    }
    this.getStudentPoints();
    
    let planStorage = localStorage.getItem('availablePlan');
    if(planStorage && planStorage !== 'undefined') {
        this.AvailablePlan = JSON.parse(planStorage);
    }

    if (this.navData?.student_id) {
      this.fetchStudentSkills(this.navData.student_id);
    }
  }

  getOfflineNote(){
    this.studentService.getStudentNote(this.navData.student_id,response=>{
      this.aggStars = ['#eeeeee', '#eeeeee', '#eeeeee', '#eeeeee', '#eeeeee'];
      this.notes = response;
      if(response.agg_ranking > 0 && response.agg_ranking < 2.6){
        this.studentBehaviour.icon = "./assets/icon/warning.png";
        this.studentBehaviour.text = this.lang.warning_behaviour;
      }else if(response.agg_ranking > 2.5 && response.agg_ranking < 3.6){
        this.studentBehaviour.icon = "./assets/icon/good.png";
        this.studentBehaviour.text = this.lang.good_behaviour;
      }else if(response.agg_ranking > 3.5 && response.agg_ranking < 4.6){
        this.studentBehaviour.icon = "./assets/icon/very-good.png";
        this.studentBehaviour.text = this.lang.very_good_behaviour;
      }else if(response.agg_ranking > 4.5 && response.agg_ranking < 5.1){
        this.studentBehaviour.icon = "./assets/icon/excellent.png";
        this.studentBehaviour.text = this.lang.excellent_behaviour;
      }else{
        this.studentBehaviour.icon = "chatbubbles";
        this.studentBehaviour.text = this.lang.no_behaviour;
      }
      if(response.notes.length > 0){
        this.notes.notes.forEach((note:any) => {
          if (note.user_id == this.userDetails.details.user_no && this.userDetails.details.pic) {
            note.teacher_pic = this.userDetails.details.pic;
          }
          let picToUse = note.teacher_pic ? note.teacher_pic : note.pic;
          if (!picToUse || picToUse === '' || picToUse === 'null' || picToUse.includes('default_avatar')) {
            picToUse = 'assets/imgs/default_avatar.png';
          } else if (!picToUse.startsWith('http') && !picToUse.startsWith('assets')) {
            picToUse = environment.docUrl + 'uploads/' + picToUse.replace('uploads/', '');
          }
          note.display_pic = picToUse;

          if((this.checkNoteDate(new Date(note.date)) && note.user_id == this.userDetails.details.user_no) || this.userDetails.details.user_type != '2'){
            if(this.userDetails.details.user_type === '2'){
               this.canAddStudentNote = false;
             }
          }
          if(note.rating > 0){
            note.selections = ['#fff', '#fff', '#fff', '#fff', '#fff'];
            for(let i=0; i< parseInt(note.rating); i++){
              note.selections[i] = "#04855f";
            }
          }
        })
        let realNo = 0;
        if(this.notes.agg_ranking % 1 == 0){
          realNo = parseInt(this.notes.agg_ranking);
        }else {
          realNo = Math.floor(this.notes.agg_ranking);
          this.halfStarPosition = realNo;
          this.halfStar = true;
        }
        for(let i=0; i< realNo; i++){
          this.aggStars[i] = "#04855f";
        }
      }else{
        this.noNotesFound = this.lang.no_note;
      } 
    },error=>{this.dataProvider.showToast(this.lang.no_internet);})
  }

  // 🟢 الإصلاح الثاني: تأمين دالة الجلب بـ try..finally لضمان إغلاق التحميل اللانهائي!
   async checkProfile() {
    this.dataProvider.showLoading();
    try {
      if (localStorage.getItem("userloggedin")) {
        this.userDetails = JSON.parse(localStorage.getItem("userloggedin"));
        this.userType = this.userDetails.details.user_type;

        let data = {
          "user_no": this.userDetails.details.user_no,
          "session_id": this.userDetails.session_id,
          "cid": this.navData?.course_id || "",
          "date": this.navData?.dateSelected || this.dataProvider.getFormatedDate(new Date()),
          "sid": this.navData?.student_id || this.navData?.sid
        };

        const response: any = await this.dataProvider.getStudentDetails(data);

        if (response && response.session && response.data) {
          this.studentService.checkStudent(response.data);
          this.studentDetails = response.data;

          if (this.studentDetails && !this.studentDetails.agg_ranking) {
            this.studentDetails.agg_ranking = this.navData?.agg_ranking || 0;
          }

          this.studentDetails.student_points = this.navData?.student_points !== undefined ? this.navData.student_points : (response.data.student_points || 0);

          let dashboardData = {
            "sid": String(data.sid),
            "userId": String(this.userDetails.details.user_no)
          };

          const dashRes: any = await this.dataProvider.getStudentProfileDashboard(dashboardData);

          if (dashRes && dashRes.success) {
            let rawTitle = dashRes.inventory?.active_title;
            if (rawTitle && rawTitle !== 'null' && rawTitle !== '') {
              this.activeCraftedTitle = typeof rawTitle === 'object' ? (rawTitle.code || rawTitle.title_name) : rawTitle;
            } else {
              this.activeCraftedTitle = null;
            }

            if (this.studentDetails) {
              this.studentDetails.active_crafted_title = this.activeCraftedTitle;
            }

            this.studentTotalPoints = dashRes.skill_tree?.skill_tree_total || 0;
            this.studentSkillData = dashRes.skill_tree?.skills || null;

            if (this.gamification) {
              this.processedBadges = this.gamification.processBadges(dashRes.inventory?.unlocked_badges || []);
              this.studentTitle = this.getStudentTitle(this.studentDetails);
            }
          }
        } else {
            // في حال الرد بفشل من السيرفر
            this.dataProvider.showToast(response?.message || 'تعذر جلب بيانات الطالب بشكل كامل');
        }
      } else {
        this.authProvider.flushLocalStorage();
        this.router.navigate(['login'], { replaceUrl: true });
      }
    } catch (error) {
      console.error("Critical Profile Error:", error);
    } finally {
      // 🟢 السحر هنا: هذا السطر سيغلق التحميل حتماً مهما حدث من أخطاء في السيرفر!
      this.dataProvider.hideLoading(); 
    }
  }


  getNotes(): Promise<void> {
    return new Promise((resolve) => {
      let data = {
        "user_no": this.userDetails.details.user_no,
        "session_id": this.userDetails.session_id,
        "cid": this.navData.course_id,
        "date": this.navData.dateSelected,
        "sid": this.navData.student_id
      };
      
      this.dataProvider.getStudentNotes(data).then((response)=>{
        this.studentService.checkStudentNotes(response,this.navData.student_id);
        this.aggStars = ['#eeeeee', '#eeeeee', '#eeeeee', '#eeeeee', '#eeeeee'];
        this.notes = response;
        
        if(response.notes.length > 0){
          this.notes.notes.forEach((note:any) => {
            if (note.user_id == this.userDetails.details.user_no && this.userDetails.details.pic) {
              note.teacher_pic = this.userDetails.details.pic;
            }

            let picToUse = note.teacher_pic ? note.teacher_pic : note.pic;
            
            if (!picToUse || picToUse === '' || picToUse === 'null' || picToUse.includes('default_avatar')) {
              picToUse = 'assets/imgs/default_avatar.png';
            } else if (!picToUse.startsWith('http') && !picToUse.startsWith('assets')) {
              picToUse = environment.docUrl + 'uploads/' + picToUse.replace('uploads/', '');
            }

            note.display_pic = picToUse;

            if((this.checkNoteDate(new Date(note.date)) && note.user_id == this.userDetails.details.user_no) || this.userDetails.details.user_type != '2'){
              if(this.userDetails.details.user_type === '2'){
                 this.canAddStudentNote = false;
               }
            }
            
            if(note.rating > 0){
              note.selections = ['#fff', '#fff', '#fff', '#fff', '#fff'];
              for(let i=0; i< parseInt(note.rating); i++){
                note.selections[i] = "#04855f";
              }
            }
          })

          let realNo = 0;
          if(this.notes.agg_ranking % 1 == 0){
            realNo = parseInt(this.notes.agg_ranking);
          }else {
            realNo = Math.floor(this.notes.agg_ranking);
            this.halfStarPosition = realNo;
            this.halfStar = true;
          }
          for(let i=0; i< realNo; i++){
            this.aggStars[i] = "#04855f";
          }
        }else{
          this.noNotesFound = this.lang.no_note;
        }  
        
        resolve();

      }).catch((error: any) =>{
        let safeErrorMsg = error?.error?.msg || error?.error?.message || error?.message || (typeof error === 'string' ? error : 'حدث خطأ غير متوقع أثناء جلب الملاحظات');
        this.dataProvider.errorALertMessage(safeErrorMsg);
        resolve();
      });
    });
  }

  async addAbsentNote(notes:any, date:any){
    let note = notes.filter((note:any)=>{
      return note.created_by == this.userDetails.details.user_no
    })
    
    if(note.length == 0){
      this.currentAbsenceNotesArray = notes;
      this.currentAbsenceDate = date;
      this.absenceNoteText = '';
      this.showAbsenceNoteModal = true;
    } else {
      this.dataProvider.showToast(this.lang.already_submit_note);
    }
  }

  hideAbsenceNoteModal() {
    this.showAbsenceNoteModal = false;
    this.absenceNoteText = '';
  }

  submitAbsenceNote() {
    if (this.absenceNoteText && this.absenceNoteText.trim() != '') {
      let dataToSave = { note: this.absenceNoteText };
      this.saveNote(dataToSave, this.currentAbsenceNotesArray, this.currentAbsenceDate);
      this.hideAbsenceNoteModal();
    } else {
      this.dataProvider.showToast(this.lang.empty_note);
    }
  }

  saveNote(noteData:any, notes:any, date:any){
    this.dataProvider.showLoading();
    let data = {
      sid: this.studentDetails.sid,
      cid: this.navData.course_id,
      date: date,
      note: noteData.note,
      user_no: this.userDetails.details.user_no,
      session_id: this.userDetails.session_id
    }

    this.dataProvider.saveAbsenceNote(data).then((response)=>{
      if(response.session){
        this.dataProvider.hideLoading();
        notes.push({
          note: noteData.note,
          ID: response.note_id,
          created_by: this.userDetails.details.user_no
        });
        this.dataProvider.showToast(response.message)
      }else{
        this.dataProvider.hideLoading();
        this.authProvider.flushLocalStorage();
        this.dataProvider.errorALertMessage(response.message);
      }
    }).catch(error=>{
      this.dataProvider.hideLoading();
      this.dataProvider.errorALertMessage(error);
    })
  }

  deleteUserNote(note_id: any, index: number) {
    this.deletePayload = { type: 'note', id: note_id, index: index };
    this.showDeleteConfirmModal = true;
  }

  deleteAbsenceNote(notes: any, note_id: any, index: number) {
    this.deletePayload = { type: 'absence', id: note_id, index: index, notesArray: notes };
    this.showDeleteConfirmModal = true;
  }

  hideDeleteConfirmModal() {
    this.showDeleteConfirmModal = false;
    this.deletePayload = null;
  }

  confirmDelete() {
    if (!this.deletePayload) return;
    
    this.dataProvider.showLoading();
    let data = {
      user_no: this.userDetails.details.user_no,
      session_id:  this.userDetails.session_id
    };

    if (this.deletePayload.type === 'note') {
      this.dataProvider.deleteStudentNote(data, this.deletePayload.id).then((response) => {
        this.canAddStudentNote = true;
        this.getNotes();
        this.dataProvider.hideLoading();
        this.hideDeleteConfirmModal();
      }).catch(error => {
        this.dataProvider.hideLoading();
        this.dataProvider.errorALertMessage(error);
        this.hideDeleteConfirmModal();
      });
    } 
    else if (this.deletePayload.type === 'absence') {
      this.dataProvider.deleteAbsenceNote(data, this.deletePayload.id).then((response) => {
        if(response.session){
          this.dataProvider.hideLoading();
          this.deletePayload.notesArray.splice(this.deletePayload.index, 1);
          this.dataProvider.showToast(response.message);
        }else{
          this.dataProvider.hideLoading();
          this.authProvider.flushLocalStorage();
          this.dataProvider.errorALertMessage(response.message);
        }
        this.hideDeleteConfirmModal();
      }).catch(error => {
        this.dataProvider.hideLoading();
        this.dataProvider.errorALertMessage(error);
        this.hideDeleteConfirmModal();
      });
    }
  }

  addNotesNote(){
    if(this.noteMessage && this.noteMessage.trim() != '') {
      if(this.noteMessage.length <= 45) {
        if(this.canAddStudentNote) {
          this.dataProvider.showLoading();
          let data = {
            sid: this.navData.student_id,
            note: this.noteMessage,
            user_id: this.userDetails.details.user_no,
            rating: this.ratingStars,
            new_rating: JSON.stringify(this.ratingStars)
          }
          this.dataProvider.addStudentNote(data).then((note_id)=>{
            this.dataProvider.hideLoading();
            this.getNotes();
            this.noteMessage = '';
            this.showNoteModal = false;
            this.dataProvider.showToast(this.lang.add_review_success_message);

          }).catch(error=>{
            this.dataProvider.hideLoading();
            this.dataProvider.errorALertMessage(error);
          })
        }else{
          this.dataProvider.showToast(this.lang.already_submit_note);  
        }
      }else {
        this.dataProvider.showToast(this.lang.max_note_length);
      }
    }
    else{
      this.dataProvider.showToast(this.lang.empty_note);
    }
  }

  EditStudentNotes(){
    if(this.noteMessage && this.noteMessage.trim() != '') {
      if(this.noteMessage.length <= 45) {
        if(this.canAddStudentNote) {
          this.dataProvider.showLoading();
          let data = {
            sid: this.navData.student_id,
            note: this.noteMessage,
            user_id: this.editNoteData.user_id,
            rating: 0,
            id : this.id,
            new_rating: JSON.stringify([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])
          }
          this.dataProvider.EditStudentNote(data).then((note_id)=>{
            this.dataProvider.hideLoading();
            this.getNotes();
            this.noteMessage = '';
            this.showNoteModal = false;
            this.id = '';
            this.dataProvider.showToast(this.lang.add_note_success_message);
          }).catch(error=>{
            this.dataProvider.hideLoading();
            this.dataProvider.errorALertMessage(error);
          })
        }else{
          this.dataProvider.showToast(this.lang.already_submit_note);  
        }
      }else {
        this.dataProvider.showToast(this.lang.max_note_length);
      }
    }
    else{
      this.dataProvider.showToast(this.lang.empty_note);
    }
  }

  addTextNotesNote(){
    if(this.noteMessage && this.noteMessage.trim() != '') {
      if(this.noteMessage.length <= 45) {
        if(this.canAddStudentNote) {
          this.dataProvider.showLoading();
          let data = {
            sid: this.navData.student_id,
            note: this.noteMessage,
            user_id: this.userDetails.details.user_no,
            rating: 0,
            user_type : this.userDetails.details.user_type,
            new_rating: JSON.stringify([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0])
          }
          this.dataProvider.addStudentNote(data).then((note_id)=>{
            this.dataProvider.hideLoading();
            this.getNotes();
            this.noteMessage = '';
            this.showNoteModal = false;
            this.dataProvider.showToast(this.lang.add_note_success_message);
          }).catch(error=>{
            this.dataProvider.hideLoading();
            this.dataProvider.errorALertMessage(error);
          })
        }else{
          this.dataProvider.showToast(this.lang.already_submit_note);  
        }
      }else {
        this.dataProvider.showToast(this.lang.max_note_length);
      }
    }
    else{
      this.dataProvider.showToast(this.lang.empty_note);
    }
  }

  async editDeleteNotes(event: any, note_id: any, index: number, note: any) {
    this.editNoteData = note;
    
    if (this.platform.width() >= 768 && event) {
      const popover = await this.popover.create({
        component: EditDeleteNotePopoverComponent,
        event: event,
        mode: 'ios',
        translucent: true,
        cssClass: 'custom-popover'
      });
      await popover.present();

      const { data } = await popover.onDidDismiss();
      
      this.zone.run(() => {
        if (data && data.selectedAction === 'edit') {
          if (note.new_ratting === '[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]') {
            this.openNoteModal('note', 'edit', note, note_id);
          } else {
            this.openNoteModal('review', 'edit', note, note_id);
          }
        }
        if (data && data.selectedAction === 'delete') {
          this.deleteUserNote(note_id, index);
        }
      });

    } else {
      const actionSheet = await this.actionSheetController.create({
        header: this.lang.cange_note || 'إجراءات الملاحظة',
        mode: 'md',
        cssClass: 'custom-action-sheet',
        buttons: [
          {
            text: this.lang.edit_title || 'تعديل الملاحظة',
            icon: 'pencil-outline',
            handler: () => {
              if(note.new_ratting === '[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]'){
                this.openNoteModal('note', 'edit', note, note_id);
              } else {
                this.openNoteModal('review', 'edit', note, note_id);
              }
            }
          },
          {
            text: this.lang.delete || 'حذف',
            icon: 'trash-outline',
            cssClass: 'text-rose-500 font-bold',
            handler: () => {
              this.deleteUserNote(note_id, index);
            }
          },
          {
            text: (this.student_detailse && this.student_detailse.cancel) ? this.student_detailse.cancel : 'إلغاء',
            icon: 'close',
            role: 'cancel'
          }
        ]
      });
      await actionSheet.present();
    }
  }

  udateNotes(data,note_id:any){
    let updates={
        sid:this.navData.student_id,
        note_id:note_id,
        rating:data.data,
        new_rating: data.data,
        note:data.noteMessage,
        updated_by:this.userDetails.details.user_no
    }
    this.dataProvider.editAbsentNotes(updates).then(res=>{
      if(res){
        this.dataProvider.showToast(res.data.msg);
        this.getNotes();
      }
    }).catch(err=>{
      this.dataProvider.showToast(err.message);
    })
  }

  checkNoteDate(date:Date){
    let currentDate = new Date();
    if(date.getDate() == currentDate.getDate() && date.getMonth() == currentDate.getMonth() && date.getFullYear() == currentDate.getFullYear()){
      return true;
    }else{
      return false;
    }
  }

  async takePicture(event?: any) {
    if (this.network.type != this.network.Connection.NONE && this.network.type != this.network.Connection.UNKNOWN) {
      if (this.platform.width() >= 768 && event) {
        const popover = await this.popover.create({
          component: ImageOptionPopoverComponent,
          event: event,
          mode: 'ios',
          translucent: true,
          cssClass: 'custom-popover'
        });
        await popover.present();

        const { data } = await popover.onDidDismiss();
        this.zone.run(() => {
          if (data && data.selectedAction === 'camera') this.handleImageSelection('camera');
          if (data && data.selectedAction === 'gallery') this.handleImageSelection('gallery');
          if (data && data.selectedAction === 'avatar') this.OpenAvatarModel();
        });

      } else {
        const actionSheet = await this.actionSheetController.create({
          header: this.lang.image_option || 'تغيير صورة الطالب',
          mode: 'md',
          cssClass: 'custom-action-sheet',
          buttons: [
            {
              text: this.lang.camera || 'التقاط بالكاميرا',
              icon: 'camera-outline',
              handler: () => { this.handleImageSelection('camera'); }
            },
            {
              text: this.lang.gallery || 'اختيار من المعرض',
              icon: 'image-outline',
              handler: () => { this.handleImageSelection('gallery'); }
            },
            {
              text: this.lang.avatar || 'اختيار صورة رمزية',
              icon: 'people-circle-outline',
              handler: () => { this.OpenAvatarModel(); }
            },
            {
              text: this.lang.cancel || 'إلغاء',
              icon: 'close',
              role: 'cancel',
              cssClass: 'text-rose-500 font-bold'
            }
          ]
        });
        await actionSheet.present();
      }

    } else {
      this.dataProvider.showToast(this.lang.no_internet);
    }
  }

  async handleImageSelection(source: 'camera' | 'gallery') {
    const base64Image = await this.imageService.takePicture(source);
    if (base64Image) {
      this.ChangeStudentProfileAvatar(base64Image); 
    }
  }

  async OpenAvatarModel() {
    const modal = await this.modalController.create({
      component: AvatarImagesComponent,
      cssClass: 'my-custom-class',
      componentProps: { student: this.studentDetails }
    });
    
    modal.onDidDismiss().then((data: any) => {
      if (data && data.data && data.data.image_url) {
        this.dataProvider.showLoading();
        this.imageService.convertUrlToBase64(data.data.image_url).then(base64 => {
          this.ChangeStudentProfileAvatar(base64);
        }).catch(err => {
          this.dataProvider.hideLoading();
          this.dataProvider.errorALertMessage("تعذر معالجة الصورة الرمزية، يرجى المحاولة مرة أخرى.");
        });
      }
    });
    return await modal.present();
  }

  ChangeStudentProfileAvatar(base64Data: string) {
    if (!base64Data) {
      this.dataProvider.hideLoading();
      return;
    }

    let finalImageData = base64Data.includes('data:image') 
                         ? base64Data 
                         : "data:image/png;base64," + base64Data;

    this.dataProvider.showLoading();
    let data = {
      user_no: this.userDetails.details.user_no,
      session_id: this.userDetails.session_id,
      imageData: finalImageData, 
      sid: this.navData.student_id
    };

    this.dataProvider.updateUserImage(data).then((response: any) => {
      this.dataProvider.hideLoading();
      if (response.session) {
        this.studentDetails.pic = response.url;
        this.dataProvider.showToast("تم تحديث الصورة بنجاح");
      } else {
        this.authProvider.flushLocalStorage();
        this.dataProvider.errorALertMessage(response.message);
      }
    }).catch((error) => {
      this.dataProvider.hideLoading();
      this.dataProvider.errorALertMessage(error?.message || "حدث خطأ في الاتصال");
    });
  }

  getSelectedStars(){
    return new Array(5);
  }

  selectStarsForRating(index:number){
    this.ratingStars = index+1;
    this.selections= ['#04855f', '#eeeeee', '#eeeeee', '#eeeeee', '#eeeeee'];
    for(let i=0;i<=index;i++){
      this.selections[i] = '#04855f';
    }
  }

  async presentNoteActionSheet(event: any, mode: any, note: any, note_id: any) {
    if (this.platform.width() >= 768 && event) {
      const popover = await this.popover.create({
        component: StudentOptionsPopoverComponent,
        event: event,
        componentProps: { student: this.studentDetails },
        mode: 'md',
        translucent: true,
        cssClass: 'custom-popover'
      });
      await popover.present();

      const { data } = await popover.onDidDismiss();
      
      this.zone.run(() => {
        if (data && data.selectedAction === 'review') this.openNoteModal('review', mode, note, note_id);
        if (data && data.selectedAction === 'note') this.openNoteModal('note', mode, note, note_id);
        if (data && data.selectedAction === 'points') this.openSkillTreeModal(); 
      });
    } else {
      const actionSheet = await this.actionSheetController.create({
        header: `إجراءات الطالب: ${this.studentDetails.name}`,
        cssClass: 'custom-action-sheet',
        mode: 'md',
        buttons: [
          {
            text: (this.student_detailse && this.student_detailse.student_review) ? this.student_detailse.student_review : 'تقييم الطالب',
            icon: 'star-outline',
            handler: () => { this.openNoteModal('review', mode, note, note_id); },
          },
          {
            text: (this.student_detailse && this.student_detailse.student_note) ? this.student_detailse.student_note : 'إضافة ملاحظة',
            icon: 'document-text-outline',
            handler: () => { this.openNoteModal('note', mode, note, note_id); },
          },
          {
            text: (this.student_detailse && this.student_detailse.student_point) ? this.student_detailse.student_point : 'نقاط الطالب',
            icon: 'medal-outline',
            handler: () => { this.openSkillTreeModal(); },
          },
          {
            text: (this.student_detailse && this.student_detailse.cancel) ? this.student_detailse.cancel : 'إلغاء',
            icon: 'close',
            role: 'cancel',
            cssClass: 'text-rose-500 font-bold',
          },
        ],
      });
      await actionSheet.present();
    }
  }

  async openNoteModal(mode, note_mode, note, note_id){
    if(mode === 'note'){
      if(note_mode === 'edit'){
        this.canAddStudentNote = true;
        this.noteMessage = note.note;
        this.id = note.id;
      }
      this.showNoteModal = true;
    } else {
      const modal = await this.modalController.create({
        component: AddReviewComponent,
        cssClass: 'my-custom-class',
        componentProps: {data: note_mode === 'edit' ? note : null, student:this.studentDetails}
      });
      modal.onDidDismiss().then(data => {
        if(data.data && data.data.data){
          this.ratingStars = (data.data.data);
          this.noteMessage = data.data.noteMessage;
          if(note_mode === 'edit'){
            this.udateNotes(data.data,note_id);
          } else {
            this.addNotesNote();
          }
        }
      });
      return await modal.present();
    }
  }

  hideNoteModal(){
    this.id = '';
    this.showNoteModal = false;
  }

  openPdf(){
    let data={
      school_id:this.userDetails.details.school_id,
      sid:this.navData.student_id
    }
    let planData={
      user_no:this.userDetails.details.user_no
    }
    this.dataProvider.showLoading();
    this.dataProvider.openPdf(planData).then(res=>{
      let url=env.serverURL+'student_report_new?school_id='+data.school_id+'&sid='+data.sid;
      this.dataProvider.openStudentReport(url).then(res=>{
        this.dataProvider.hideLoading();
        if(res){
          window.open(res.url, '_system');
        }else{
          this.dataProvider.showToast('Unable to generate report');
        }
      }).catch(e=>{
          this.dataProvider.hideLoading();
          this.dataProvider.showToast('Unable to generate report');
      })
    }).catch(e=>{
      this.dataProvider.hideLoading();
      this.presentAlertConfirm();
    })
  }

  async presentAlertConfirm() {
    const alert = await this.alertController.create({
      header: this.planLang.not_valid,
      mode:'ios',
      buttons: [
        {
          text: this.planLang.cancel,
          role: 'cancel',
          cssClass: 'secondary',
          handler: (blah) => {
            console.log('Confirm Cancel: blah');
          }
        }, {
          text: this.planLang.subscribe,
          handler: () => {
            this.router.navigate(['available-plan']);
          }
        }
      ]
    });

    await alert.present();
  }

  ngOnInit() {
  }
  
  async presentPrintOption(event: any) {
    // if(this.AvailablePlan?.plan?.slug == 'free' || this.AvailablePlan?.isExpire == true){
    //   this.presentAlertPlanConfirm();
    //   return;
    // }

    if(this.network.type != this.network.Connection.NONE && this.network.type != this.network.Connection.UNKNOWN){
      if (this.platform.width() >= 768 && event) {
        const popover = await this.popover.create({
          component: PrintOptionsPopoverComponent,
          event: event,
          mode: 'md',
          translucent: true,
          cssClass: 'custom-popover'
        });

        await popover.present();

        const { data } = await popover.onDidDismiss();
        
        if (data && data.selectedAction) {
          this.printReport(data.selectedAction);
        }
      } else {
        const actionSheet = await this.actionSheetController.create({
          header: this.lang.report_option || 'خيارات التصدير والطباعة',
          cssClass: 'custom-action-sheet',
          mode: 'md',
          buttons: [
            {
              text: this.lang.exel || 'تصدير كملف Excel',
              icon: 'grid-outline',
              cssClass: 'text-emerald-600 font-bold',
              handler: () => {
                this.printReport('exel');
              }
            },
            {
              text: this.lang.pdf || 'عرض كملف PDF',
              icon: 'document-text-outline',
              cssClass: 'text-rose-500 font-bold',
              handler: () => {
                this.printReport('pdf');
              }
            },
            {
              text: this.lang.cancel || 'إلغاء',
              icon: 'close',
              role: 'cancel',
              cssClass: 'text-slate-400 font-medium border-t border-slate-100',
              handler: () => {}
            }
          ]
        });
        await actionSheet.present();
      }

    } else {
      this.dataProvider.showToast(this.lang.no_internet);
    }
  }

  printReport(type) {
    let planData = {
      user_no: this.userDetails.details.user_no,
      report_type: type
    }
    
    this.dataProvider.showLoading();
    
    this.dataProvider.openPdf(planData).then(res => {
        let studentData = {
          "school_id": this.userDetails.details.school_id,
          "sid": this.navData.student_id,
          "report_type": type
        }

        if (type === "pdf") {
          let url = env.serverURL + 'student_report_new?school_id=' + studentData.school_id + '&sid=' + studentData.sid;
          
          this.dataProvider.openStudentReport(url).then(async (res: any) => {
            this.dataProvider.hideLoading();
            
            if (res && res.data) {
              let htmlContent = res.data;

              if (this.platform.is('cordova') || this.platform.is('capacitor')) {
                let options: PrintOptions = { orientation: 'portrait' };
                this.printer.print(htmlContent.replace(/(\r\n|\n|\r)/gm, ''), options).then(
                  (onSuccess: any) => {
                    console.log('تم فتح نافذة الطباعة بنجاح');
                  },
                  (e: any) => {
                    console.log('تعذرت الطباعة، سيتم الفتح في المتصفح', e);
                    this.openHtmlInBrowser(htmlContent);
                  }
                );
              } 
              else {
                this.openHtmlInBrowser(htmlContent);
              }

            } else {
              this.dataProvider.showToast('تعذر جلب بيانات التقرير من الخادم');
            }
          }).catch(e => {
            this.dataProvider.hideLoading();
            this.dataProvider.showToast('خطأ في الاتصال بسيرفر التقارير');
          });
        } 
        else {
          this.dataProvider.getStudentReport(studentData).then(async (res: any) => {
            this.dataProvider.hideLoading();
            if (res && res.data) {
                let splitUrl = res.data.split("/");
                let filename = splitUrl[splitUrl.length - 1];
                let url = `${environment.docUrl}uploads/stufollowup/${filename}`;
                await Browser.open({ url: url });
            } else {
              this.dataProvider.showToast(this.lang.report_error);
            }
          }, error => {
            this.dataProvider.hideLoading();
            this.dataProvider.showToast(this.lang.report_error);
          });
        }
        
    }).catch(e => {
      this.dataProvider.hideLoading();
      this.presentAlertConfirm();
    });
  }

  openHtmlInBrowser(htmlContent: string) {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        printWindow.print();
      }, 1000);
    } else {
      this.dataProvider.showToast('يرجى السماح بالنوافذ المنبثقة (Pop-ups) لعرض التقرير');
    }
  }

  async presentAlertPlanConfirm() {
    let buttonsAdmin =  [
      {
        text: this.planLang.cancel,
        role: 'cancel',
        cssClass: 'secondary',
        handler: (blah) => {
          console.log('Confirm Cancel: blah');
        }
      }, {
        text: this.planLang.subscribe,
        handler: () => {
          this.router.navigate(['available-plan']);
        }
      }
    ];
    let button =  [
      {
        text: "Ok",
        role: 'cancel',
        cssClass: 'secondary',
        handler: (blah) => {
          console.log('Confirm Cancel: blah');
        }
      }
    ];

    const alert = await this.alertCtrl.create({
      header: this.userDetails.details.is_school_admin == 1 ?  this.planLang.not_valid : this.planLang.not_valid_for_others,
      mode:'ios',
      buttons:  this.userDetails.details.is_school_admin == 1 ? buttonsAdmin : button
    });

    await alert.present();
  }

  async presentAlertForPremiumsection(){
    let button =  [
      {
        text: "Ok",
        role: 'cancel',
        cssClass: 'secondary',
        handler: (blah) => {
          console.log('Confirm Cancel: blah');
        }
      }
    ];

    const alert = await this.alertCtrl.create({
      header:this.planLang.not_valid_for_others,
      mode:'ios',
      buttons: button
    });

    await alert.present();
  }

  notes_action(){
    if(this.id){
      this.EditStudentNotes()
    }else{
      this.addTextNotesNote();
    }
  }

  getArabicDayName(dateString) {
    const [year, month, day] = dateString.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    const formatter = new Intl.DateTimeFormat('ar', { weekday: 'long' });
    return formatter.format(date);
  }

  async openUserDetails(ev: any, student: any) {
    const modal = await this.modalController.create({
      component: StudentDetailsComponent,
      componentProps: {
        student: student,
        userType: this.userType,
        course_id: this.navData.course_id
      },
      breakpoints: [0, 0.5, 0.75, 1],
      initialBreakpoint: 0.75,
      handleBehavior: 'cycle',
      cssClass: 'lineone-bottom-sheet'
    });
    
    await modal.present();

    const { data, role } = await modal.onDidDismiss();

    if (role === 'save' && data) {
      this.studentDetails.phone_no = data.phone_no;
      this.studentDetails.phone_no_two = data.phone_no_two;
      this.studentDetails.medical_condition = data.medical_condition;
      
      student.phone_no = data.phone_no;
      student.phone_no_two = data.phone_no_two;
      student.medical_condition = data.medical_condition;
    }
  }

  sendPushMessageToStudentParent(msg){
    let studentData = {
      "student_id":this.userDetails.details.school_id,
      "message": msg,
      "title":"Absent"
    }
    this.dataProvider.sendPushMessageToStudentParent(studentData).then(res => {
      console.log(res)
    },error=>{
      this.dataProvider.hideLoading();
      this.dataProvider.showToast(this.lang.report_error);
    })

  }

  getStudentCallOfReports(){
    let data = {
      "user_no": this.userDetails.details.user_no,
      "student_id": this.navData.student_id,
      "school_id":this.userDetails.details.school_id
    };
    this.dataProvider.GetAllCallOfStudentReport(data).then(res => {
      this.callOfStudentsReport = res.data;
    },error=>{
      this.dataProvider.hideLoading();
      this.dataProvider.showToast(this.lang.report_error);
    })
    this.GetStudentPledgesReport();
  }

  GetStudentPledgesReport(){
    let data = {
      "user_no": this.userDetails.details.user_no,
      "student_id": this.navData.student_id,
      "school_id":this.userDetails.details.school_id
    };
    this.dataProvider.GetStudentPledgesReport(data).then(res => {
      this.AllStudentPledgesReports = res.data;
    },error=>{
      this.dataProvider.hideLoading();
      this.dataProvider.showToast(this.lang.report_error);
    })
  }

  printReports(type){
    if(type == "pledges"){
      let data = {
        "user_no": this.userDetails.details.user_no,
        "course_id": this.navData.course_id,
        "student_id": this.navData.student_id,
        "school_id":this.userDetails.details.school_id
      };
      this.dataProvider.showLoading();
      this.dataProvider.generateStudentPledgesReportPDF(data).then(res => {
        this.dataProvider.hideLoading();
        let data = res.data;
      let options: PrintOptions = { orientation: 'portrait'};
      this.printer.print(data.toString().replace(/(\r\n|\n|\r)/gm, '')).then((onSuccess:any)=>{
      },(e:any)=>{
      this.dataProvider.showToast(this.lang.report_error);
      });
      },error=>{
        this.dataProvider.hideLoading();
        this.dataProvider.showToast(this.lang.report_error);
      })
    }
    if(type == "callOfParent"){
      let data = {
        "user_no": this.userDetails.details.user_no,
        "course_id": this.navData.course_id,
        "student_id": this.navData.student_id,
        "school_id":this.userDetails.details.school_id
      };
      this.dataProvider.showLoading();
      this.dataProvider.generateCallOfStudentPDF(data).then(res => {
        this.dataProvider.hideLoading();
        let data = res.data;
      let options: PrintOptions = { orientation: 'portrait'};
      this.printer.print(data.toString().replace(/(\r\n|\n|\r)/gm, '')).then((onSuccess:any)=>{
      },(e:any)=>{
      this.dataProvider.showToast(this.lang.report_error);
      });
      },error=>{
        this.dataProvider.hideLoading();
        this.dataProvider.showToast(this.lang.report_error);
      })
    }

  }

  showInventoryModal: boolean = false;
  inventoryTab: string = 'titles'; 
  
  studentWallet: any = {};
  unlockedTitles: string[] = [];
  unlockedBadges: string[] = [];
  activeCraftedTitle: string = null;

  async openInventoryModal() {
    await this.fetchInventory();
    this.showInventoryModal = true;
  }

  closeInventoryModal() {
    this.showInventoryModal = false;
  }

  fetchInventory(): Promise<void> {
    return new Promise((resolve) => {
      let sid = this.studentDetails?.sid || this.navData?.student_id;
      
      let body = { 
        sid: String(sid),
        userId: String(this.userDetails.details.user_no)
      };
      
      this.dataProvider.getStudentInventory(body).then((res: any) => {
        if (res && res.success) {
          this.studentWallet = res.wallet;
          this.unlockedTitles = res.unlocked_titles || [];
          this.unlockedBadges = res.unlocked_badges || [];
          
          let rawActive = res.active_title;
          if (rawActive !== undefined && rawActive !== null && rawActive !== 'null' && rawActive !== '') {
              this.activeCraftedTitle = typeof rawActive === 'object' 
                                        ? (rawActive.title_ar || rawActive.title_name || rawActive.title) 
                                        : rawActive;
          }

          if (this.studentDetails) {
              this.studentDetails.active_crafted_title = this.activeCraftedTitle;
          }
          
          let skills = this.studentSkillData || this.studentDetails || {};
          let points = this.studentTotalPoints || this.studentDetails?.student_points || 0;

          if (this.gamification) {
              this.studentTitle = this.gamification.getFinalStudentTitle(this.activeCraftedTitle, skills, points);
              this.processedTitles = this.gamification.processTitles(this.unlockedTitles);
              this.processedBadges = this.gamification.processBadges(this.unlockedBadges);
          }
        }
        
        resolve();
      }).catch(err => {
        resolve();
      });
    });
  }

  canCraft(cost: any): boolean {
    if(!this.studentWallet) return false;
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
    this.dataProvider.showLoading();
    
    let sid = this.studentDetails?.sid || this.navData?.student_id;
    
    let body = { 
      sid: String(sid), 
      title_code: title.code, 
      cost: JSON.stringify(title.cost), 
      userId: String(this.userDetails.details.user_no)
    };
    
    try {
      let res: any = await this.dataProvider.craftSkillTitle(body);
      this.dataProvider.hideLoading();
      if (res.success) {
        this.dataProvider.showToast(res.msg);
        await this.fetchInventory(); 
        this.fetchStudentSkills(sid); 
      } else {
        this.dataProvider.errorALertMessage(res.msg);
      }
    } catch(e) {
      this.dataProvider.hideLoading();
    }
  }

  async toggleTitle(titleCode: string | null) {
    this.dataProvider.showLoading();
    let sid = this.studentDetails?.sid || this.navData?.student_id;
    
    let body = { 
      sid: String(sid), 
      title_code: titleCode ? String(titleCode) : '',
      userId: String(this.userDetails.details.user_no)
    };
    
    try {
      let res: any = await this.dataProvider.equipTitle(body);
      this.dataProvider.hideLoading();
      if (res.success) {
        this.activeCraftedTitle = titleCode;
        this.dataProvider.showToast(res.msg);
        
        this.studentTitle = this.gamification.getFinalStudentTitle(titleCode, this.studentSkillData, this.studentTotalPoints);
      }
    } catch(e) {
      this.dataProvider.hideLoading();
    }
  }

  async switchCategory(selectedCategory: string) {
    this.category = selectedCategory;

    if (this.category === 'absence' && !this.isAbsenceLoaded) {
      this.dataProvider.showLoading(); 
      
      let followUpData = {
        "date": this.navData.dateSelected || new Date().toISOString().split('T')[0],
        "user_no": this.userDetails.details.user_no,
        "session_id": this.userDetails.session_id,
        "course_id": this.navData.course_id,
        "school_id": this.userDetails.details.school_id
      };
      
      try {
        const followUpRes: any = await this.dataProvider.getFollowUpStudentList(followUpData);
        if (followUpRes && followUpRes.data && followUpRes.data.students) {
          let matched = followUpRes.data.students.find((s: any) => s.sid === this.navData.student_id);
          if (matched) {
            this.zone.run(() => {
              this.studentDetails.unacceptable_absent_days = matched.unacceptable_absent_days !== undefined ? matched.unacceptable_absent_days : 0;
              this.studentDetails.suspend_days = matched.suspend_days !== undefined ? matched.suspend_days : 0;
              this.studentDetails.medical_days = matched.medical_days !== undefined ? matched.medical_days : 0;
            });
          }
        }
        
        let agg_ranking = this.notes && this.notes.agg_ranking ? Number(this.notes.agg_ranking) : 5;
        if((Number(this.studentDetails.unacceptable_absent_days) == 10 || Number(this.studentDetails.unacceptable_absent_days) == 15) && agg_ranking < 4){
           let message = `عزيزي ولي الأمر، نحيطكم علماً بأن المتعلم ${this.studentDetails.name} معرض لخطر التعثر الدراسي.`;
           this.sendPushMessageToStudentParent(message);
        }

        this.isAbsenceLoaded = true; 
      } catch(e) {
        console.error(e);
      } finally {
        this.dataProvider.hideLoading();
      }
    }
    
    else if (this.category === 'pledgesAndCallOffParent' && !this.isReportsLoaded) {
      this.dataProvider.showLoading();
      
      try {
        this.getStudentCallOfReports(); 
        this.isReportsLoaded = true; 
      } catch(e) {
        console.log(e);
      } finally {
        this.dataProvider.hideLoading();
      }
    }

    else if (this.category === 'notes' && !this.isNotesLoaded) {
      this.dataProvider.showLoading(); 
      
      try {
        await this.getNotes(); 
        this.isNotesLoaded = true; 
      } catch(e) {
        console.error(e);
      } finally {
        this.dataProvider.hideLoading();
      }
    }
  }

  get isFrozen(): boolean {
    if (!this.studentDetails || !this.studentDetails.frozen_until) return false;
    const today = new Date().toISOString().split('T')[0];
    return this.studentDetails.frozen_until >= today;
  }

  get finalStudentTitle(): string {
    if (!this.studentDetails) return '🌱 بطل في البداية';

    const activeTitle = this.studentDetails.active_crafted_title;
    
    const skillsData = {
      cognitive: Number(this.studentDetails.cognitive || 0),
      social: Number(this.studentDetails.social || 0),
      discipline: Number(this.studentDetails.discipline || 0),
      emotional: Number(this.studentDetails.emotional || 0),
      practical: Number(this.studentDetails.practical || 0)
    };

    const totalPoints = Number(this.studentDetails.student_points || 0);

    return this.gamification.getFinalStudentTitle(activeTitle, skillsData, totalPoints);
  }

  getStudentTitle(student: any): string {
    if (!student) return '🌱 بطل في البداية';

    const activeCode = student.active_crafted_title || 
                       student.student_data?.active_crafted_title || 
                       this.activeCraftedTitle || 
                       student.active_title || 
                       student.title;

    const skillsData = {
      cognitive: Number(student.cognitive || this.studentSkillData?.cognitive || 0),
      social: Number(student.social || this.studentSkillData?.social || 0),
      discipline: Number(student.discipline || this.studentSkillData?.discipline || 0),
      emotional: Number(student.emotional || this.studentSkillData?.emotional || 0),
      practical: Number(student.practical || this.studentSkillData?.practical || 0)
    };
    const totalPoints = Number(student.student_points || this.studentTotalPoints || 0);

    return this.gamification.getFinalStudentTitle(activeCode, skillsData, totalPoints);
  }

  // 🟢 دالة للتعامل مع زر العودة بناءً على نوع المستخدم
  goBack() {
    // إذا كان المستخدم ولي أمر (userType == '4')
    if (this.userType == '4' || this.userDetails?.details?.user_type == '4') {
      this.zone.run(() => {
        // تم إضافة مسار الصفحة هنا بشكل صحيح
        // ملاحظة: إذا كان المسار مختلفاً في ملف التوجيه (routing)، قم بتغييره، مثلاً
        this.router.navigate(['/tabs/children'], { replaceUrl: true });
      });
    } else {
      // للمستخدمين الآخرين (معلم، إدارة، مشرف)
      this.navCtrl.back();
    }
  }
  
  
}