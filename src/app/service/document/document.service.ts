import { Injectable } from '@angular/core';
import { Browser } from '@capacitor/browser';

@Injectable({
  providedIn: 'root'
})
export class DocumentService {

  constructor() { }

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