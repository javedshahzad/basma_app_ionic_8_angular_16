import { ErrorHandler, Injectable, Injector } from '@angular/core';
import { DataService } from '@services/data/data.service';
import { TranslateService } from '@ngx-translate/core';
import { loadSentryAngular } from './service/sentry/sentry-lazy';

// معالج أخطاء موحّد على مستوى التطبيق: يرسل كل خطأ غير مُعالَج محلياً إلى
// Sentry (لا شيء يُرسَل إن كان environment.sentryDsn فارغاً — راجع main.ts)،
// ويعرض تنبيهاً ودياً للمستخدم بدل شاشة بيضاء أو تجمّد صامت.
// نستخدم Injector بدل الحقن المباشر في الـ constructor لتفادي إجبار إنشاء
// DataService أثناء إقلاع التطبيق قبل أن تكون جاهزة.
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private sentryHandler: { handleError: (error: unknown) => void } | null = null;
  // Sentry's SDK is dynamically imported (see sentry-lazy.ts) so it doesn't
  // add weight to the initial bundle — any error thrown before that import
  // resolves is buffered here and flushed once it's ready, so a bootstrap-
  // time error still reaches Sentry instead of being silently dropped.
  private pendingErrors: unknown[] = [];

  constructor(private injector: Injector) {
    loadSentryAngular()?.then(Sentry => {
      this.sentryHandler = Sentry.createErrorHandler({ showDialog: false, logErrors: true });
      this.pendingErrors.forEach(error => this.sentryHandler!.handleError(error));
      this.pendingErrors = [];
    });
  }

  handleError(error: unknown): void {
    if (this.sentryHandler) {
      this.sentryHandler.handleError(error);
    } else {
      this.pendingErrors.push(error);
    }

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
