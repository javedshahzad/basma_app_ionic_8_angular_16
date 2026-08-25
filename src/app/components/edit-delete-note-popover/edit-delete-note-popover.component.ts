import { Component, ChangeDetectionStrategy } from '@angular/core';
import { PopoverController, IonicModule } from '@ionic/angular';

import { TranslateModule } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-edit-delete-note-popover',
  templateUrl: './edit-delete-note-popover.component.html',
  styleUrls: ['./edit-delete-note-popover.component.scss'], // إضافة هذا السطر
  imports: [IonicModule, TranslateModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditDeleteNotePopoverComponent {
  constructor(private popoverController: PopoverController) {}

  close(action: string) {
    this.popoverController.dismiss({ selectedAction: action });
  }
}
