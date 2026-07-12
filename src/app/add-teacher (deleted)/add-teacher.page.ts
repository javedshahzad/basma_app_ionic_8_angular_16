import { Component, OnInit, Input,NgZone } from '@angular/core';
import { NavController, AlertController, ModalController } from '@ionic/angular';
import { AuthService } from '../service/auth/auth.service';
import { DataService } from '../service/data/data.service';
import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';


@Component({
  selector: 'app-add-teacher',
  templateUrl: './add-teacher.page.html',
  styleUrls: ['./add-teacher.page.scss'],
})
export class AddTeacherPage implements OnInit {
	userDetails:any;
	teacherData:any={};
	validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
	lang:any={};
	classes: any;
	usersDataclass: any = [];
	
  constructor(public navCtrl: NavController, 
              public translate: TranslateService,
              public dataProvider: DataService, 
              public authProvider: AuthService,  
              public alertCtrl: AlertController, 
              private route : ActivatedRoute,
              public zone:NgZone,
              private router:Router,
              public modalController: ModalController) {

  	this.translate.get("alertmessages").subscribe((res)=>{
      this.lang = res;
	  //console.log('langres',res);
    })
               }

  ngOnInit() {
  	if(localStorage.getItem("userloggedin")){
           // console.log('logged in');
      this.userDetails = JSON.parse(localStorage.getItem("userloggedin"));
	  this.getCourses();
    }
  }
  getCourses() {
	let data = {
		"user_no": this.userDetails.details.user_no,
		"school_id": this.userDetails.details.school_id,
		"session_id": this.userDetails.session_id
	};
	this.dataProvider.showLoading();
	this.dataProvider.getCourses(data).then(response => {
		this.dataProvider.hideLoading();
		if (response.session) {
			this.classes = response.data;
			console.log("classs==>", this.classes);
		}

	}).catch(error => {
		this.dataProvider.hideLoading();
		this.dataProvider.errorALertMessage(error);
	})

}

portChange(event) {
	console.log("ev", event);
	// this.usersDataclass= event.value;
}
  
  submit(){
  	console.log(this.teacherData);
  	if(this.validateForm()){
  		console.log('validateForm');
  		this.teacherData.email_id= this.teacherData.email_id || '';
  		this.teacherData.user_no= this.userDetails.details.user_no;
      	this.teacherData.school_id= this.userDetails.details.school_id;
		  this.teacherData.class = JSON.stringify(this.usersDataclass);

      	this.dataProvider.showLoading();
      	this.dataProvider.registerTeacher(this.teacherData).then((res:any)=>{
	      this.dataProvider.hideLoading();
	      console.log('plan',res);
	      const navigation: NavigationExtras = {
              state :{
                isUpdated:true
              }
            };
          this.zone.run(() => {
            this.router.navigate(['manage-teacher'], navigation);
          });

	    }).catch(e=>{
	      this.dataProvider.showToast(e);
	      this.dataProvider.hideLoading();
	      console.log(e);
	    })
  	}
  }

  validateForm(){
  	if(this.teacherData.email_id && !this.teacherData.email_id.match(this.validRegex)){
  		this.dataProvider.showToast(this.lang.email_valid);
  		return false
  	}else if(!this.teacherData.first_name || this.teacherData.first_name==''){
  		this.dataProvider.showToast(this.lang.usename_required);
  		return false;
  	}else if(!this.teacherData.username || this.teacherData.username==''){
  		this.dataProvider.showToast(this.lang.user_id_required);
  		return false
  	}else if(!this.teacherData.password || this.teacherData.password==''){
  		this.dataProvider.showToast(this.lang.password_required);
  		return false;
  	}else if(!this.teacherData.confirm_password || (this.teacherData.confirm_password != this.teacherData.password)){
  		this.dataProvider.showToast(this.lang.confirm_password_required);
  		return false;
  	}else{
  		return true;
  	}
  }

}
