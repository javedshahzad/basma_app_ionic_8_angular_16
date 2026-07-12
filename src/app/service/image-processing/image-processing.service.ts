import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource, ImageOptions } from '@capacitor/camera';
import { FileUploadService } from '../file-upload/file-upload.service';
import { Filesystem } from '@capacitor/filesystem';

@Injectable({
  providedIn: 'root'
})
export class ImageProcessingService {

  constructor(
    private platform: Platform,
    private fileUpload: FileUploadService
  ) {}

  // 1. دالة فتح الكاميرا أو المعرض (تبقى كما هي)
  async takePicture(sourceType: 'camera' | 'gallery'): Promise<string | null> {
    try {
      // نطلب "مسار الصورة" فقط (Uri) وهذا يمنع تجمد النظام تماماً
      const image = await Camera.getPhoto({
        quality: 100, 
        resultType: CameraResultType.Uri, // 🟢 السحر هنا: نطلب الرابط بدلاً من Base64
        source: sourceType === 'camera' ? CameraSource.Camera : CameraSource.Photos,
        allowEditing: false // نوقف التعديل لمنع الأخطاء في بعض الهواتف
      });

      if (image.webPath) {
        // نرسل الرابط المحلي لدالة المعالجة السريعة
        return await this.resizeAndGetBase64(image.webPath);
      }
      return null;
    } catch (e) {
      console.error("Camera Error: ", e);
      return null; 
    }
  }

  // 2. 🟢 دالة جديدة أضفها أسفل takePicture: تقوم بالضغط السريع باستخدام Canvas
  private resizeAndGetBase64(webPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // أقصى حجم للصورة (500 بكسل مناسب جداً وسريع للرفع)
        const MAX_SIZE = 500;
        let width = img.width;
        let height = img.height;

        // حساب الأبعاد الجديدة مع الحفاظ على تناسب الصورة
        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }

        canvas.width = width;
        canvas.height = height;
        
        // رسم الصورة وتصغيرها
        ctx?.drawImage(img, 0, 0, width, height);
        
        // تحويلها إلى Base64 بصيغة JPEG الخفيفة وبجودة 70%
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      
      img.onerror = (err) => reject(err);
      img.src = webPath; // بدء تحميل الصورة
    });
  }

  // 2. الدالة المحدثة: تحويل الرابط إلى Base64 بأعلى مستوى من الأمان
  convertUrlToBase64(url: string): Promise<string> {
    return new Promise(async (resolve, reject) => {
      
      // 🟢 1. إصلاح خطأ السلاش المزدوج الذي ظهر في الكونسول
      const cleanUrl = url.replace(/([^:]\/)\/+/g, "$1");

      // 🟢 2. إذا كنا على الجوال، نستخدم قوة النظام الأصلي متجاهلين حماية المتصفح (CORS)
      if (this.platform.is('cordova') || this.platform.is('capacitor')) {
        try {
          const base64 = await this.downloadAndReadNativeFile(cleanUrl);
          resolve(base64);
          return; // ننهي الدالة هنا بنجاح
        } catch (err) {
          console.error("فشل التحميل الأصلي، سنحاول بطريقة المتصفح", err);
        }
      }

      // 🟢 3. طريقة المتصفح (تعمل فقط إذا كان السيرفر يسمح بـ CORS)
      const img = new Image();
      img.crossOrigin = 'Anonymous'; 
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0);
          
          const fullBase64 = canvas.toDataURL('image/png');
          const pureBase64 = fullBase64.split(',')[1];
          resolve(pureBase64);
        } catch (e) {
          reject('canvas_error');
        }
      };
      
      img.onerror = () => {
        console.error("حماية المتصفح (CORS) منعت قراءة الصورة.");
        reject('cors_error');
      };

      // إضافة طابع زمني لكسر الكاش
      img.src = cleanUrl + '?t=' + new Date().getTime();
    });
  }

  // 3. المعالجة السحرية لملفات الجوال (تبقى كما هي لأنها قوية)
  private async downloadAndReadNativeFile(url: string): Promise<string> {
    try {
      const response: any = await this.fileUpload.DownloadAndGetUri(url);
      const nativeUrl = response.nativeURL;

      const contents = await Filesystem.readFile({
        path: nativeUrl
      });

      return contents.data as string;
      
    } catch (error) {
      throw error;
    }
  }
}