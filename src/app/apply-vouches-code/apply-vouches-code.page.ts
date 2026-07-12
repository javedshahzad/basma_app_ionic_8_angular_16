import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { DataService } from '../service/data/data.service';

@Component({
  selector: 'app-apply-vouches-code',
  templateUrl: './apply-vouches-code.page.html',
  styleUrls: ['./apply-vouches-code.page.scss'],
})
export class ApplyVouchesCodePage implements OnInit {
  plans=[];
  plan_id:any;
  code:any;
  userDetails: any;
  AvailablePlan: any;

  constructor(
        public navCtrl: NavController, 
        public translate: TranslateService, 
        public dataProvider: DataService, 
  ) { }

  ngOnInit() {
    this.AvailablePlan = JSON.parse(localStorage.getItem('availablePlan')); 
    this.userDetails = JSON.parse(localStorage.getItem("userloggedin"));
    //this.getPlan();
  }
  getPlan(){
  	let data={
  		userId:''
  	}
  	this.dataProvider.getPlan(data).then(res=>{
  		this.plans=res.response;
  	}).catch(e=>{
  		console.log(e);
  		this.plans=e.plans;
  	})
  }
  ApplyCode(){
    this.AvailablePlan = JSON.parse(localStorage.getItem('availablePlan')); 
    let data = {
      "user_no": this.userDetails.details.user_no,
      "school_id":this.userDetails.details.school_id,
      "code":this.code,
      "plan_id":this.AvailablePlan.plan.id
    };
    this.dataProvider.ApplyVoucherCode(data).then(res => {
      console.log(res);
      if(res.success){
        this.dataProvider.showToast(res.msg);
        this.navCtrl.navigateRoot("/tabs/classlist");
      }else{
        this.dataProvider.showToast(res.msg);
      }
    },error=>{
      this.dataProvider.hideLoading();
      this.dataProvider.showToast("Something went wrong...");
    })
  }
}
