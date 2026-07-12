import { Component, Input, OnInit } from '@angular/core';
import { Device } from '@awesome-cordova-plugins/device/ngx';
import { PopoverController, NavController, Platform, ModalController, IonicModule } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../service/auth/auth.service';
import { DataService } from '../../service/data/data.service';
import { DatabaseService } from '../../service/database/database.service';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-student-details',
  templateUrl: './student-details.component.html',
  styleUrls: ['./student-details.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslateModule, FormsModule]
})
export class StudentDetailsComponent implements OnInit {
  @Input()student:any;
	@Input()data:any;
  student_medical={}
  phone: any;
  phone_no_two: any;
  medical_condition: any;
  userDetails: any;
  userType: any;
  disabledFileds: boolean=true;
  constructor(public popoverController: PopoverController,
    public navCtrl: NavController, 
        public device: Device, 
        public authProvider: AuthService,
        public platform: Platform, 
        private dataProvider:DataService,
        public translate: TranslateService, 
        public dbProvider: DatabaseService,
      public modalController: ModalController) { }

  ngOnInit() {
    console.log(this.student);
    console.log(this.data)
    this.userDetails = JSON.parse(localStorage.getItem("userloggedin"));
    this.userType = this.userDetails.details.user_type;
    this.phone = this.student.phone_no;
    this.phone_no_two = this.student.phone_no_two;
    this.medical_condition = this.student.medical_condition;
    if(Number(this.userType) == 1 || Number(this.userType) == 2 || Number(this.userType) == 7){
      this.disabledFileds = false;
    }else{
      this.disabledFileds = true;
    }
  }

  
  closeModal(actionRole: string = 'cancel'){
  	this.modalController.dismiss(null, actionRole);
  }

  saveChanges(){
    let updateData={
      sid: this.student.sid,
      phone_no: this.phone,
      phone_no_two: this.phone_no_two,
      medical_condition: this.medical_condition
    }
    
    this.dataProvider.updateStudentPhone(updateData, res => {
     setTimeout(() => {
      // 🔴 نرسل البيانات المحدثة (updateData) مع أمر الإغلاق (save)
      this.modalController.dismiss(updateData, 'save');
    }, 1000);
    })
  }
  
}
