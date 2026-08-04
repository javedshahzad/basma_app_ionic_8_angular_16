import { Component } from '@angular/core';

// مكوّن وهمي بديل يُستخدم فقط في RouterTestingModule.withRoutes([...]) داخل
// ملفات spec — بعض الصفحات تستدعي router.navigate(['login']) أثناء الإنشاء،
// و RouterTestingModule بلا مسارات مسجّلة يرفض أي تنقّل بخطأ NG04002. تسجيل
// هذا المكوّن كوجهة كافٍ لإسكات الخطأ دون الحاجة لأي منطق حقيقي.
@Component({
  standalone: true,
  template: ''
})
export class DummyRouteComponent {}
