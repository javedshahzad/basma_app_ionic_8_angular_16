import { Router } from '@angular/router';
import { AuthService } from './service/auth/auth.service';
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { tap, retry, catchError } from 'rxjs/operators';
import { AlertController } from '@ionic/angular';
import { DataService } from './service/data/data.service';

@Injectable()
export class MyInterceptor implements HttpInterceptor {
 
  constructor(
    public alertController: AlertController, 
    private dataProvider: DataService, 
    private auth: AuthService,
    private router: Router
  ) {}

  intercept(
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    
    let requestToHandle = request;

    // 1️⃣ الشق الأول: المنطق الخاص بك (إضافة UUID و user_no لطلبات POST المحددة)
    if (request.method === 'POST' && localStorage.getItem('userloggedin')
     && !request.url.endsWith('logout') 
     && !request.url.endsWith('login') 
     && !request.url.endsWith('schoolRegister') ) {
      
      let user = JSON.parse(localStorage.getItem('userloggedin') || '{}');
      const uuid = localStorage.getItem('uuid');
     
      requestToHandle = request.clone({
        params: request.params.set('uuid', uuid || '1122112233112233').set("user_no", user.details?.user_no || ''),
      });
    }

    // 2️⃣ الشق الثاني: إرسال الطلب ومراقبته (سواء كان معدلاً أم لا)
    return next.handle(requestToHandle).pipe(
      
      // أ) التحقق من الردود الناجحة (المنطق الخاص بك للـ Status 100)
      tap((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          const responseData = event.body; 
          if (responseData && responseData.status === 100) {
            console.log('Terminating request due to status 100 in the response');
            this.presentAlert("تنبيه مطور: الخادم يطلب تسجيل الخروج بسبب عدم تطابق رقم الجهاز UUID. تم إيقاف الطرد لتسهيل التطوير.");
          }
        }
      }),

      // ب) 🚀 خوارزمية التراجع الأسّي (Exponential Backoff) لحماية التطبيق من أخطاء السيرفر
      retry({
        count: 3, // المحاولة 3 مرات كحد أقصى
        delay: (error: HttpErrorResponse, retryCount: number) => {
          // إذا كان الخطأ بسبب الضغط 429 أو صيانة مؤقتة 503
          if (error.status === 429 || error.status === 503) {
            const delayTime = Math.pow(2, retryCount - 1) * 1000; // 1s, 2s, 4s
            console.warn(`⏳ سيرفر مشغول (الخطأ ${error.status}). المحاولة رقم ${retryCount} بعد ${delayTime}ms...`);
            return timer(delayTime); 
          }
          // إنهاء المحاولات فوراً لأي خطأ آخر (مثل 404 أو 401)
          return throwError(() => error);
        }
      }),

      // ج) 🛡️ اصطياد الأخطاء النهائية بعد نفاذ المحاولات (أو انقطاع الإنترنت)
      catchError((error: HttpErrorResponse) => {
        if (error.status === 429 || error.status === 503) {
          this.dataProvider.hideLoading();
          this.dataProvider.showToast('الشبكة مزدحمة حالياً، يرجى المحاولة بعد قليل.');
        } 
        else if (error.status === 0) {
          this.dataProvider.hideLoading();
          this.dataProvider.showToast('تعذر الاتصال بالخادم. تأكد من اتصالك بالإنترنت.');
        }

        return throwError(() => error);
      })
    );
  }

  // الدوال المساعدة الخاصة بك كما هي
  async presentAlert(message: string) {
    const alert = await this.alertController.create({
      header : 'تحذير',
      message: message,
      buttons: ['Ok'],
    });
    await alert.present();
  }

  logout() {
    let userDetail = JSON.parse(localStorage.getItem("userloggedin") || '{}');
    let data = {
      "user_no": userDetail.details?.user_no,
      "session_id": userDetail.session_id
    }
    this.dataProvider.showLoading();
    this.auth.doLogout(data).then(() => {
      this.dataProvider.hideLoading();
      this.router.navigate(['login'], {replaceUrl: true});
    }).catch(() => {
      this.dataProvider.hideLoading();
    });
  }
}