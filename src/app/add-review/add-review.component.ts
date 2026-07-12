import { Component, Input, OnInit } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { DataService } from '../service/data/data.service';
import { Browser } from '@capacitor/browser';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-review',
  templateUrl: './add-review.component.html',
  styleUrls: ['./add-review.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslateModule, FormsModule]
})
export class AddReviewComponent implements OnInit {
  ratingStars: number;
  // @Input() lang;
  @Input() data;
  @Input() student:any;
  selections: any [] = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
  postData: any [] = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5];
  stars_array = [
    {
      title: 'متميز'
    },
    {
      title: 'جيد جداً'
    },
    {
      title: 'جيد'
    },
     {
      title: 'مقبول'
    },
    {
      title: 'ضعيف'
    },
   
    
   
    
  ];
  noteMessage: string = '';
  lang: any;
  studentDetails: any;

  // أضف هذه المتغيرات في أعلى الكلاس
  showImageViewer: boolean = false;
  viewImageUrl: string = '';

  constructor(public modalController: ModalController, public dataProvider: DataService,public translate: TranslateService,) { }

  ngOnInit() {
    console.log(this.data,this.student);
    this.studentDetails = this.student;
    if(this.studentDetails.pic == 'null' || this.studentDetails.pic == null){
      this.studentDetails.pic = 'assets/imgs/default_avatar.png'
    }
    console.log(this.studentDetails,"student details")
    // this.userDetails = JSON.parse(localStorage.getItem("userloggedin"));
    this.translate.get("alertmessages").subscribe((val)=>{
      this.lang = val;
    });
    if(this.data){
      if(this.data.note){
        this.noteMessage = this.data.note;
      }
      if(this.data.new_ratting){
        this.postData = JSON.parse(this.data.new_ratting);
        this.selections = this.postData;
      }
    }
  }

  dismiss() {
    // using the injected ModalController this page
    // can "dismiss" itself and optionally pass back data
    this.modalController.dismiss({
      role: false,
      'dismissed': true,
    });
  }

  async openIndividualFollowupUrl() {
      await Browser.open({ url: 'https://basmapp.com/IndividualFollow-upPlan.pdf' });
  }

  async openGroupCounselingSessionUrl() {
      await Browser.open({ url: 'https://basmapp.com/GroupCounselingSession.pdf' });
  }

  // أضف هاتين الدالتين لفتح وإغلاق الصورة المكبرة
  openFullscreenImage(url: string) {
    this.viewImageUrl = url;
    this.showImageViewer = true;
  }

  closeFullscreenImage() {
    this.showImageViewer = false;
    setTimeout(() => {
      this.viewImageUrl = '';
    }, 300); // تأخير بسيط لجمالية الإغلاق
  }

  getSelectedStars(){
    let stars_array = [
      {
        title: 'متميز'
      },
      {
        title: 'جيد جداً'
      },
      {
        title: 'جيد'
      },
      {
        title: 'مقبول'
      },
      {
        title: 'ضعيف'
      }
    ]
    console.log(stars_array)
      return stars_array;
    return new Array(5);
  }
  getSemArray() {
    let stars_array = [
    {
      title: 'متميز'
    },
    {
      title: 'جيد جداً'
    },
    {
      title: 'جيد'
    },
    {
      title: 'مقبول'
    },
    {
      title: 'ضعيف'
    }
  ]
  console.log(stars_array)
    return stars_array;
  }

  selectStarsForRating(post_data_index: number, index: number){
    if(index === 0){
      index = 4;
    } else if(index === 1){
      index = 3;
    }else if(index === 2){
      index = 2;
    }else if(index === 3){
      index = 1;
    }else if(index === 4){
      index = 0;
    }
    this.postData[post_data_index] = index+1;
    this.selections= ['#04855f', '#eeeeee', '#eeeeee', '#eeeeee', '#eeeeee'];
    for(let i=0;i<=index;i++){
      this.selections[post_data_index] = '#04855f';
    }
    console.log(this.postData);
  }

  onClickSend(){
    if(this.noteMessage && this.noteMessage.trim() != '') {
      if(this.noteMessage.length <= 45) {
    this.modalController.dismiss({ 
        'dismissed': true,
         data: this.postData,
         noteMessage: this.noteMessage
    });
    }else {
        this.dataProvider.showToast(this.lang.max_note_length);
      }
    }
    else{
      this.dataProvider.showToast(this.lang.empty_note);
    }
  }
  OpenDownloadFile(url){
    window.open(url,"_blank");
  }

}
