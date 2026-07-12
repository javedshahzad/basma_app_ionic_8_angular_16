import { Injectable, NgZone } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';

// 🟢 استيراد خدمة التخزين الموحدة والآمنة
import { StorageService } from '../service/storage.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate { // 🟢 إضافة implements CanActivate
    
    constructor(
      private zone: NgZone, 
      private router: Router, // 🟢 استخدام Router بدلاً من NavController هنا
      private storageSr: StorageService // 🟢 حقن خدمة التخزين
    ) {}

    // 🟢 تحويل الدالة لـ async للتعامل مع الذاكرة بأمان
    async canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
      
      // القراءة الآمنة من الذاكرة
      const isLoggedIn = await this.storageSr.get("userloggedin");
      let isUser = false;

      if (isLoggedIn) {
        if (isLoggedIn.userType !== 'guest') {
          isUser = true;
        } else {
          isUser = false;
        }
      } else {
        isUser = false;
      }

      // توجيه المستخدم لصفحة الدخول إذا لم يكن مصرحاً له
      if (!isUser) {
        this.zone.run(() => { 
          this.router.navigate(['/login'], { replaceUrl: true }); 
        });
        return false;
      }
      
      return true;
    }
}