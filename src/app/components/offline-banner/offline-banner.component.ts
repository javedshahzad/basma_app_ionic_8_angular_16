import { Component, ChangeDetectionStrategy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConnectivityService } from '../../service/connectivity/connectivity.service';
import { OfflineQueueService } from '../../service/offline-queue/offline-queue.service';

@Component({
  selector: 'app-offline-banner',
  templateUrl: './offline-banner.component.html',
  imports: [IonicModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OfflineBannerComponent {
  constructor(
    public connectivity: ConnectivityService,
    public offlineQueue: OfflineQueueService,
    private translate: TranslateService
  ) {}

  pendingSyncLabel(): string {
    const template = this.translate.instant('alertmessages.pending_sync_count') || '{{count}} تغييرات بانتظار المزامنة';
    return template.replace('{{count}}', String(this.offlineQueue.pendingCount()));
  }
}
