import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { DataService } from '../data/data.service';
import { BehaviorSubject } from 'rxjs';
import { Filesystem, Directory } from '@capacitor/filesystem'; // 🟢 مكتبة التحميل الآمنة الحديثة

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  public uploadProgress: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  constructor(
    public httpClient: HttpClient,
    public dataProvider: DataService
  ) {
    this.dataProvider.language.subscribe(res => {
      environment.lang_code = res;
    });
  }

  // 1. تحويل Base64 إلى Blob ليقبله السيرفر
  dataURItoBlob(dataURI: string) {
    const byteString = atob(dataURI.split(',')[1]);
    const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  }

  // 2. الدالة الرئيسية للرفع (تعوض uploadfile القديمة المعقدة)
  // 🟢 تم تحويلها لدالة غير متزامنة (async) لتسريع الأداء
  async uploadfile(mediaData: any, dataParams: any, endPoint: string, callBack: any) {
    this.dataProvider.showLoading();
    let formData = new FormData();

    for (let key in dataParams) {
      formData.append(key, dataParams[key]);
    }
    formData.append('lang_code', environment.lang_code || 'ar');

    if (mediaData) {
      if (typeof mediaData === 'string' && mediaData.startsWith('data:')) {
        try {
          // 🟢 السحر هنا: استخدام fetch يحول البيانات في أجزاء من الثانية دون تجميد التطبيق
          const response = await fetch(mediaData);
          const blob = await response.blob();
          const ext = mediaData.startsWith('data:video') ? '.mp4' : '.jpg';
          const fileName = new Date().getTime() + ext;
          formData.append('file', blob, fileName);
        } catch (err) {
          this.dataProvider.hideLoading();
          callBack(false);
          return;
        }
      } else {
        formData.append('file', mediaData);
      }
    }

    const url = environment.serverURL + '/' + endPoint;

    this.httpClient.post(url, formData).subscribe({
      next: (res) => { 
        this.dataProvider.hideLoading();
        callBack(res); 
      },
      error: (err) => {
        console.error('Upload Error: ', err);
        this.dataProvider.hideLoading();
        callBack(false);
      }
    });
  }

  // 3. درع حماية: توجيه الدالة القديمة للحديثة (لكي لا تتعطل الصفحات الأخرى التي تستدعيها)
  uploadByTransfer(media: any, formData: any, endPoint: string, callBack: any) {
     this.uploadfile(media, formData, endPoint, callBack);
  }

  // 4. الدالة الحيوية المفقودة (تم تحديثها لتستخدم Capacitor للتحميل الآمن والسريع)
  // الدالة الحيوية المفقودة (تم تحديثها لتستخدم Capacitor للتحميل الآمن والسريع)
  async DownloadAndGetUri(url: string) {
    // 🟢 السطر السحري: أضفنا كلمة reject هنا ليتعرف عليها الكود
    return new Promise(async (resolve, reject) => { 
      try {
        let xy = url.split("/");
        var fileName = xy[xy.length - 1];

        // التحميل المباشر والآمن عبر Capacitor
        const result = await Filesystem.downloadFile({
          url: encodeURI(url),
          path: fileName,
          directory: Directory.Data 
        });

        // إرجاع المسار في حالة النجاح
        resolve({ nativeURL: result.path });

      } catch (err) {
        console.error('Download Error', err);
        // 🟢 الآن الدالة reject ستعمل بكفاءة وترسل الخطأ للصفحات الأخرى
        reject(err); 
      }
    });
  }
}