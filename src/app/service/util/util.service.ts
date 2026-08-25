import { Injectable } from '@angular/core';
import { Filesystem, Directory } from '@capacitor/filesystem';

/**
 * Pure, self-contained helper functions, split out of DataService. None of
 * these depend on any other DataService member — unlike the other
 * extracted services, this one takes no DataService dependency at all
 * (injecting it here would be circular, since DataService itself delegates
 * these methods back to UtilService).
 */
@Injectable({
  providedIn: 'root'
})
export class UtilService {

  // Function to convert base64 string to blob
  base64toBlob(base64Data: string, contentType: string): Blob {
    const sliceSize = 512;
    const byteCharacters = atob(base64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);

      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }

      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }

    return new Blob(byteArrays, { type: contentType });
  }

  dataURItoBlob(dataURI: string): Blob {
    const byteString = atob(dataURI.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);

    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }

    return new Blob([ab], { type: 'image/jpeg' });
  }

  generateRandomFileName(extension: string = ''): string {
    const timestamp = new Date().getTime();
    const randomString = Math.random().toString(36).substring(2);
    const fileName = `file_${timestamp}_${randomString}${extension}`;
    return fileName;
  }

  /**
   * get date in yyyy-mm-dd
   * @param date date object
   */
  getFormatedDate(date: Date) {
    let m = date.getMonth() + 1;
    return date.getFullYear() + '-' + m + '-' + date.getDate();
  }

  /**
   * Download image (Modern Capacitor Way)
   * @param url image url
   */
  downloadImage(url: string): Promise<boolean> {
    return new Promise(async (resolve, reject) => {
      try {
        let n = new Date().valueOf();
        let fileName = `Download_${n}.png`;

        // استخدام تقنية كاباسيتور الحديثة للتحميل المباشر بدون مكتبات خارجية
        const result = await Filesystem.downloadFile({
          url: encodeURI(url),
          path: fileName,
          directory: Directory.Documents // حفظ آمن وموحد للاندرويد والايفون
        });

        console.log('تم التحميل بنجاح: ', result);
        resolve(true);
      } catch (error) {
        console.error('خطأ في التحميل: ', error);
        reject('حدث خطأ غير متوقع أثناء التحميل');
      }
    });
  }

  caclulateHours(start: string | Date, end: string | Date) {
    var date1: Date = new Date(end);
    var date2: Date = new Date(start);
    var diffInSeconds = Math.abs(date1.getTime() - date2.getTime()) / 1000;
    var days = Math.floor(diffInSeconds / 60 / 60 / 24);
    var hours = Math.floor((diffInSeconds / 60 / 60) % 24);
    var minutes = Math.floor((diffInSeconds / 60) % 60);
    var seconds = Math.floor(diffInSeconds % 60);
    var milliseconds = Math.round((diffInSeconds - Math.floor(diffInSeconds)) * 1000);
    return `${hours}:${minutes}:${seconds}`;
  }

  addHoursToDate(date: Date, hours: number): Date {
    return new Date(new Date(date).setHours(date.getHours() + hours));
  }
}
