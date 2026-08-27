import { Component, ChangeDetectionStrategy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ConnectivityService } from '../../service/connectivity/connectivity.service';

@Component({
  selector: 'app-offline-banner',
  templateUrl: './offline-banner.component.html',
  imports: [IonicModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OfflineBannerComponent {
  constructor(public connectivity: ConnectivityService) {}
}
