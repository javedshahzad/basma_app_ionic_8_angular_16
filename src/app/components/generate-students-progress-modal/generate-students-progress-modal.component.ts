import { Component, Input, ChangeDetectionStrategy, Signal } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

export interface GenerateProgress {
  current: number;
  total: number;
  failed: number;
  currentLabel: string;
}

@Component({
  selector: 'app-generate-students-progress-modal',
  templateUrl: './generate-students-progress-modal.component.html',
  imports: [IonicModule, TranslateModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GenerateStudentsProgressModalComponent {
  @Input() generateLang: any;
  @Input({ required: true }) progress!: Signal<GenerateProgress>;

  percent(): number {
    const p = this.progress();
    return p.total > 0 ? Math.round((p.current / p.total) * 100) : 0;
  }
}
