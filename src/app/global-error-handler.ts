import { ErrorHandler, Injectable, Injector } from '@angular/core';
import * as Sentry from '@sentry/angular';
import { DataService } from '@services/data/data.service';
import { TranslateService } from '@ngx-translate/core';

// معالج أخطاء موحّد على مستوى التطبيق: يرسل كل خطأ غير مُعالَج محلياً إلى
// Sentry (لا شيء يُرسَل إن كان environment.sentryDsn فارغاً — راجع main.ts)،
// ويعرض تنبيهاً ودياً للمستخدم بدل شاشة بيضاء أو تجمّد صامت.
// نستخدم Injector بدل الحقن المباشر في الـ constructor لتفادي إجبار إنشاء
// DataService أثناء إقلاع التطبيق قبل أن تكون جاهزة.
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private sentryHandler = Sentry.createErrorHandler({
    showDialog: false,
    logErrors: true,
  });

  constructor(private injector: Injector) {}

  handleError(error: unknown): void {
    this.sentryHandler.handleError(error);

    try {
      const dataProvider = this.injector.get(DataService);
      const translate = this.injector.get(TranslateService);
      dataProvider.showToast(
        translate.instant('alertmessages.unexpected_error_retry') || 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.'
      );
    } catch {
      // تجاهل أي فشل في عرض التنبيه نفسه لتفادي حلقة أعطال
    }
  }
}
