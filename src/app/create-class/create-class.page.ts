import { Component, OnInit,NgZone,Input } from '@angular/core';
import { NavController,ModalController, MenuController, ToastController, AlertController,
         LoadingController } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { DatabaseService } from '../service/database/database.service';
import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';

@Component({
  selector: 'app-create-class',
  templateUrl: './create-class.page.html',
  styleUrls: ['./create-class.page.scss'],
})
export class CreateClassPage implements OnInit {
  @Input() classes:any;
  class:any = {};
  lang:any = {};
  AvailablePlan: any;
 
  /**
   * 
   * @param navCtrl Use for navigation between pages
   * @param translate used for translation service 
   * @param viewCtrl For view dismiss
   * @param dataProvider Use for getting data from the API
   */
  constructor(public navCtrl: NavController, public translate: TranslateService,
              public viewCtrl: ModalController, public dataProvider: DataService) {
                this.translate.get("alertmessages").subscribe((res)=>{
                  this.lang = res;
                })
  }

  ionViewWillEnter() {
    this.AvailablePlan = JSON.parse(localStorage.getItem('availablePlan')); 
    console.log('ionViewDidLoad CreateClassPage');
    if(localStorage.getItem("userloggedin")){
      let user = JSON.parse(localStorage.getItem("userloggedin"));
      this.class['school_id'] = user.details.school_id;
      this.class['user_no'] = user.details.user_no;
    }else{
      this.viewCtrl.dismiss(false);
    }
  }

  getSeminars(){
    return Array(8);
  }

  registerClass() {
    let cleanPostData = {
      code: String(this.class.code || '').trim(),
      name: String(this.class.name || '').trim(),
      desc: String(this.class.desc || '').trim(),
      semno: String(this.class.semno || '1').trim(),
      school_id: String(this.class.school_id || '').trim(),
      user_no: String(this.class.user_no || '').trim()
    };

    this.dataProvider.showLoading();
    this.dataProvider.createNewCourse(cleanPostData).then((response: any) => {
      this.dataProvider.hideLoading();
      
      // 🔴 قراءة session ليتطابق مع السيرفر
      if (response && (response.session === true || response.success === true)) {
        
        // 1. عرض رسالة سريعة تختفي تلقائياً في الأسفل (بدون نافذة منبثقة)
        this.dataProvider.showToast(response.msg || response.message || "تم إنشاء الصف بنجاح");
        
        // 2. إغلاق هذه النافذة فوراً، مما سيحفز صفحة classlist لتحديث قائمة الصفوف
        this.viewCtrl.dismiss(true);
        
      } else {
        // هذه النافذة المنبثقة المزعجة لن تظهر الآن إلا في حالات الفشل الحقيقية
        this.dataProvider.errorALertMessage(response.msg || response.message || "فشل في تسجيل البيانات");
      }
    }).catch(error => {
      this.dataProvider.hideLoading();
      this.dataProvider.errorALertMessage("خطأ في الاتصال بقاعدة البيانات.");
    });
  }

  ngOnInit() {
  this.class.semno = 1;
}

}
