import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { IonicModule } from '@ionic/angular';

// 🟢 حالة خطأ مشتركة: أيقونة + رسالة + زر إعادة المحاولة —
// docs/ui-audit.md finding #11: الصفحات كانت تعرض toast عند فشل
// الطلب ثم تترك المحتوى فارغاً بلا أي وسيلة لإعادة المحاولة.
@Component({
  selector: 'app-error-state',
  templateUrl: './error-state.component.html',
  imports: [IonicModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorStateComponent {
  @Input() message: string = 'تعذر تحميل البيانات. تأكد من اتصالك بالإنترنت وحاول مجدداً.';
  @Input() retryLabel: string = 'إعادة المحاولة';
  @Output() retry = new EventEmitter<void>();
}
