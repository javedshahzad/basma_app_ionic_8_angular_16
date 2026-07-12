import { Component, OnInit,NgZone,Input } from '@angular/core'; 
import { NavController, NavParams, AlertController, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { DataService } from '../../service/data/data.service';
import { Location } from '@angular/common';


@Component({
  selector: 'app-select-message-user',
  templateUrl: './select-message-user.page.html',
  styleUrls: ['./select-message-user.page.scss'],
})
export class SelectMessageUserPage implements OnInit {
	userDetails:any;
  selectedUsers:any=[];
  selectedUsersShow:any=[];
  users:any=[];
  allUsers:any=[];
  lang:any;
  
  constructor(public navCtrl: NavController, 
		  	      public dataProvider: DataService,
		          public translate: TranslateService,
		          public alertCtrl: AlertController, 
			        private route : ActivatedRoute,
			        private router:Router,
			        public zone:NgZone, 
			        private location:Location,
		          public platform: Platform) {
  	this.route.queryParams.subscribe((params:any) => {
      this.selectedUsers = params.selectedUsers ? params.selectedUsers : [];
      this.selectedUsersShow = params.selectedUsersShow;
	      if (this.router.getCurrentNavigation().extras.state) {
	     //  		 this.users = this.router.getCurrentNavigation().extras.state;
	  			// this.allUsers = this.allUsers.concat(this.users.splice(0, 20));
	      }
	    });
	    this.translate.get("alertmessages").subscribe((response) => {
	      this.lang = response;
	    });

   }

  ngOnInit() {
  	 	if(localStorage.getItem("userloggedin")){
	      this.userDetails = JSON.parse(localStorage.getItem("userloggedin"));
	      this.getUsers();
	  	}
	  	console.log(this.users)
  }
    getUsers(){
    let data={
      'school_id':this.userDetails.details.school_id
    }
    this.dataProvider.showLoading();
    this.dataProvider.getAllSchoolUsers(data).then(res => {
    this.dataProvider.hideLoading();
        console.log('seminar class',res);
        if(res.data){
          this.users=res.data;
          this.allUsers = this.allUsers.concat(this.users.splice(0, 20));
        }
     
  }).catch(error=>{
    this.dataProvider.hideLoading();
    this.dataProvider.showToast(error);
    console.log(error)
  })
  }

  filterList(event){
    //this.selectTopic=[];
    let input = (<HTMLInputElement>document.getElementById('search')).value;
    console.log(input);

    let data={
    	input:input,
    	school_id:this.userDetails.details.school_id
    }
    this.dataProvider.searchAllUser(data).then(resp=>{
    	if(resp.data){
        	this.users=resp.data;
          if(this.users.length > 1){
            this.allUsers = this.users.splice(0, 20);
          }else{
            this.allUsers = this.users;
          }
        }
    }).catch(arr=>{
    	console.log(arr)
    })
  }

   selectUser(users,eve,id){
    console.log(users);
    let isPresent=false;
    let ind;
    for (let i = 0; i < this.selectedUsers.length; i++) {
      if(this.selectedUsers[i]==users.user_no){
        isPresent=true;
        ind=i;
      }
    }
    if(eve.detail.checked==true){
      if(!isPresent){
        if(users.user_no!=this.userDetails.details.user_no){
          this.selectedUsers.push(users.user_no)
        }else{
         this.dataProvider.showToast(this.lang.same_user);
         let elem= <HTMLFormElement>(document.getElementById('ch'+id));
          elem['checked']=false;
        }
      }
    }else{
      if(isPresent){
        this.selectedUsers.splice(ind,1);
      }
    }
    for (let i = 0; i < this.selectedUsersShow.length; i++) {
      if(this.selectedUsersShow[i]==users.username){
        isPresent=true;
        ind=i;
      }
    }
    if(eve.detail.checked==true){
      if(!isPresent){
        if(users.username!=this.userDetails.details.username){
          this.selectedUsersShow.push(users.username)
        }else{
         this.dataProvider.showToast(this.lang.same_user);
         let elem= <HTMLFormElement>(document.getElementById('ch'+id));
          elem['checked']=false;
        }
      }
    }else{
      if(isPresent){
        this.selectedUsersShow.splice(ind,1);
      }
    }
     console.log(this.selectedUsers,'selectedUsersShow',this.selectedUsersShow);
  }

	    doInfinite(infiniteScroll:any) {
		    setTimeout(() => {
		      this.allUsers = this.allUsers.concat(this.users.splice(0, 20));
		      infiniteScroll.target.complete();
		    }, 500);
		  }

  sendUser(){
  	// const navigation: NavigationExtras = {
   //          state : this.selectedUsers
   //        };
   //  this.zone.run(() => {
   //    this.router.navigate(['sendmessage'], navigation);
   //  });
   let data={
     'selectedUsers':this.selectedUsers,
     'selectedUsersShow':this.selectedUsersShow
   }
   this.dataProvider.selectedUsers.emit(data);
   this.location.back();
  }

}
