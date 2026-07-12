import { Injectable } from '@angular/core';
import { Browser } from '@capacitor/browser';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {

  constructor() { }

  /**
   * 🟢 الدالة القديمة - تم الإبقاء على اسمها لتجنب أي خلل في الملفات الأخرى
   * تم تحديث المنطق الداخلي ليعمل عبر Capacitor Browser بدلاً من InAppBrowser المذوف
   */
  async openPdf__OLD(path: string) {
    console.log('Calling Legacy Function openPdf__OLD :::', path);
    try {
      // نقوم بتشغيل المتصفح الحديث مباشرة
      await Browser.open({ url: path });
    } catch (error) {
      console.error('Error in openPdf__OLD:', error);
      // خط دفاع أخير في حال فشل المتصفح المدمج
      window.open(path, '_blank');
    }
  }

  /**
   * 🟢 الدالة الحديثة الأساسية
   */
  async openPdf(url: string, isFile?: boolean) {
    console.log('Calling Modern Function openPdf :::', url);
    
    if (isFile && !url.toLowerCase().endsWith('.pdf')) {
        url = url + '.pdf';
    }
    
    try {
      await Browser.open({ url: url });
    } catch (error) {
      console.error('Error in openPdf:', error);
      window.open(url, '_system');
    }
  }
}