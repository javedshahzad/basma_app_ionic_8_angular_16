import { Component, OnInit } from '@angular/core';
import { ModalController, IonicModule } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { DataService } from '../../service/data/data.service';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-avatar-images',
  templateUrl: './avatar-images.component.html',
  styleUrls: ['./avatar-images.component.scss'],
  standalone: true, // إضافة هذا السطر
  imports: [IonicModule, CommonModule, TranslateModule, FormsModule]
})
export class AvatarImagesComponent implements OnInit {
  imageList = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21];
  DocUrl: string;
  
  // 🔴 متغير جديد لتتبع الصورة التي تم النقر عليها
  selectedImageId: number | null = null; 

  constructor(
    public modalController: ModalController,
    public dataProvider: DataService,
    public translate: TranslateService
  ) {
      this.DocUrl = environment.docUrl;
  }

  ngOnInit() {}

  dismiss() {
    this.modalController.dismiss();
  }

  onSelectImage(i: number) {
    // 1. تحديد الصورة النشطة (الشاشة ستتحدث تلقائياً بفضل Angular)
    this.selectedImageId = i; 
    
    // 2. تجهيز الرابط
    let url = `${this.DocUrl}/uploads/avatar/Asset-${i}.png`;
    console.log("Selected Avatar URL:", url);
    
    // 3. إغلاق النافذة وتمرير الصورة بعد تأثير بصري قصير
    setTimeout(() => {
      this.modalController.dismiss({
        image_url: url
      });
    }, 450); // 450 ملي ثانية كافية لرؤية تفاعل الزر قبل الإغلاق
  }
}