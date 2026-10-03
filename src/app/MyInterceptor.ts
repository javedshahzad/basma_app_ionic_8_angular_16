import { Router } from '@angular/router';
import { AuthService } from '@services/auth/auth.service';
import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpResponse,
  HttpErrorResponse,
  HttpParams
} from '@angular/common/http';
import { Observable, throwError, timer, TimeoutError, from } from 'rxjs';
import { tap, retry, catchError, timeout, switchMap } from 'rxjs/operators';
import { AlertController } from '@ionic/angular';
import { DataService } from '@services/data/data.service';
import { TranslateService } from '@ngx-translate/core';

// login/schoolRegister don't have a token yet; refreshToken is what mints
// one and must stay reachable even when the current access token is dead.
const AUTH_EXEMPT_ENDPOINTS = ['logout', 'login', 'schoolRegister', 'refreshToken'];

@Injectable()
export class MyInterceptor implements HttpInterceptor {
  constructor(
    public alertController: AlertController,
    private dataProvider: DataService,
    private auth: AuthService,
    private router: Router,
    private translate: TranslateService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let requestToHandle = request;
    const isAuthExempt = AUTH_EXEMPT_ENDPOINTS.some(endpoint => request.url.endsWith(endpoint));

    // 0️⃣ JWT: يُرفق كترويسة Authorization، وليس داخل جسم الطلب — هذا هو آلية
    // المصادقة الفعلية الآن (لم يعد session_id مستخدَماً إطلاقاً).
    if (!isAuthExempt && this.auth.accessToken) {
      requestToHandle = requestToHandle.clone({
        setHeaders: { Authorization: `Bearer ${this.auth.accessToken}` }
      });
    }

    // 1️⃣ الشق الأول: المنطق الخاص بك (إضافة UUID و user_no لطلبات POST المحددة)
    // 🔒 تُضاف إلى جسم الطلب (body) بدلاً من رابط الطلب (query params) حتى لا تظهر
    // في سجلات الخادم (access logs) كما لو كانت جزءاً من الرابط.
    if (
      request.method === 'POST' &&
      this.auth.currentUser &&
      !isAuthExempt
    ) {
      const uuid = this.auth.currentUuid || '1122112233112233';
      const userNo = this.auth.currentUser.details?.user_no || '';

      if (requestToHandle.body instanceof HttpParams) {
        requestToHandle = requestToHandle.clone({
          body: requestToHandle.body.set('uuid', uuid).set('user_no', userNo)
        });
      } else if (requestToHandle.body instanceof FormData) {
        const formData = requestToHandle.body;
        formData.set('uuid', uuid);
        formData.set('user_no', userNo);
        requestToHandle = requestToHandle.clone({ body: formData });
      } else {
        // Unknown body shape — fall back to the previous query-param
        // behavior rather than risk mangling a body we don't recognize.
        requestToHandle = requestToHandle.clone({
          params: requestToHandle.params.set('uuid', uuid).set('user_no', userNo)
        });
      }
    }

    // رفع الملفات (FormData) قد يستغرق وقتاً طويلاً على شبكة بطيئة، لذا نستثنيه
    // من سقف الوقت (timeout) حتى لا تفشل عمليات رفع مشروعة لكنها بطيئة
    const isUpload = requestToHandle.body instanceof FormData;

    // 2️⃣ الشق الثاني: إرسال الطلب ومراقبته (سواء كان معدلاً أم لا)
    let response$ = next.handle(requestToHandle);

    if (!isUpload) {
      // حد أقصى 30 ثانية لكل محاولة، حتى لا يبقى الطلب معلقاً إلى الأبد عند انقطاع صامت
      response$ = response$.pipe(timeout(30000));
    }

    return response$.pipe(
      // أ) التحقق من الردود الناجحة (المنطق الخاص بك للـ Status 100)
      tap((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse) {
          const responseData = event.body;
          if (responseData && responseData.status === 100) {
            console.log('Terminating request due to status 100 in the response');
            this.presentAlert(
              'تنبيه مطور: الخادم يطلب تسجيل الخروج بسبب عدم تطابق رقم الجهاز UUID. تم إيقاف الطرد لتسهيل التطوير.'
            );
          }
        }
      }),

      // ب) 🚀 خوارزمية التراجع الأسّي (Exponential Backoff) لحماية التطبيق من أخطاء السيرفر
      retry({
        count: 3, // المحاولة 3 مرات كحد أقصى
        delay: (error: HttpErrorResponse, retryCount: number) => {
          // إذا كان الخطأ بسبب الضغط 429 أو صيانة مؤقتة 503 — حالات آمنة لإعادة المحاولة
          // لأن الطلب لم يُعالَج فعلياً.
          // 🔴 لا تتم إعادة المحاولة عند status 0: قد يعني انقطاع حقيقي، لكنه أيضاً الرمز نفسه
          // الذي يظهر عند إلغاء الطلب بسبب التنقل بين الصفحات — إعادة المحاولة هنا كانت
          // تُسبب تأخيراً ملحوظاً (١-٧ ثوانٍ) عند التنقل، فالفشل الفوري أفضل من الانتظار الصامت.
          // لا تتم إعادة المحاولة عند انتهاء المهلة (timeout) لأن الطلب قد يكون وصل للسيرفر فعلاً
          // ونُفّذ، وإعادة إرساله قد تكرر عمليات غير آمنة (مثل تسجيل حضور أو إضافة ملاحظة مرتين).
          if (error.status === 429 || error.status === 503) {
            const delayTime = Math.pow(2, retryCount - 1) * 1000; // 1s, 2s, 4s
            console.warn(`⏳ سيرفر مشغول (الخطأ ${error.status}). المحاولة رقم ${retryCount} بعد ${delayTime}ms...`);
            return timer(delayTime);
          }
          // إنهاء المحاولات فوراً لأي خطأ آخر (مثل 404 أو 401 أو status 0 أو انتهاء المهلة)
          return throwError(() => error);
        }
      }),

      // ج) 🛡️ اصطياد الأخطاء النهائية بعد نفاذ المحاولات (أو انقطاع الإنترنت أو انتهاء المهلة)
      catchError((error: any) => {
        // د) 🔄 انتهاء صلاحية access token: تجديد صامت عبر refresh token ثم
        // إعادة المحاولة مرة واحدة فقط. فشل التجديد يعني أن الجلسة انتهت
        // فعلاً (refresh token غير موجود/منتهي/مُلغى) — تسجيل خروج فوري.
        if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthExempt) {
          return from(this.auth.refreshAccessToken()).pipe(
            // The refresh attempt itself blew up (e.g. the local credential
            // store couldn't be read), which is different from the server
            // rejecting the token (that resolves to null below). Surface the
            // original 401 -- with its real status, not a status-less error --
            // and do NOT sign the user out: nothing says their session is
            // dead, and the next request simply tries the refresh again.
            catchError(() => throwError(() => error)),
            switchMap(newAccessToken => {
              if (!newAccessToken) {
                this.dataProvider.hideLoading();
                this.auth.flushLocalStorage().then(() => {
                  this.router.navigate(['login'], { replaceUrl: true });
                });
                return throwError(() => error);
              }
              const retriedRequest = requestToHandle.clone({
                setHeaders: { Authorization: `Bearer ${newAccessToken}` }
              });
              return next.handle(retriedRequest);
            })
          );
        }

        if (error instanceof TimeoutError) {
          this.dataProvider.hideLoading();
          this.dataProvider.showToast(
            this.translate.instant('alertmessages.request_timeout_retry') || 'استغرق الطلب وقتاً طويلاً، يرجى المحاولة مرة أخرى.'
          );
        } else if (error.status === 429 || error.status === 503) {
          this.dataProvider.hideLoading();
          this.dataProvider.showToast(
            this.translate.instant('alertmessages.network_busy_retry_later') || 'الشبكة مزدحمة حالياً، يرجى المحاولة بعد قليل.'
          );
        } else if (error.status === 0) {
          this.dataProvider.hideLoading();
          this.dataProvider.showToast(
            this.translate.instant('alertmessages.cannot_connect_check_internet') || 'تعذر الاتصال بالخادم. تأكد من اتصالك بالإنترنت.'
          );
        }

        return throwError(() => error);
      })
    );
  }

  // الدوال المساعدة الخاصة بك كما هي
  async presentAlert(message: string) {
    const alert = await this.alertController.create({
      header: 'تحذير',
      message: message,
      buttons: ['Ok']
    });
    await alert.present();
  }

  logout() {
    let userDetail = this.auth.currentUser || {};
    let data = {
      user_no: userDetail.details?.user_no,
      session_id: userDetail.session_id
    };
    this.dataProvider
      .run(() => this.auth.doLogout(data))
      .then(() => {
        this.router.navigate(['login'], { replaceUrl: true });
      })
      .catch(() => {});
  }
}
