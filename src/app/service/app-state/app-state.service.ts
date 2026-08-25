import { Injectable } from '@angular/core';
import { HttpEventType } from '@angular/common/http';
import { Subject, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';

// Selection payload broadcast by select-message-user.page.ts (recipients
// picker) — user_no can be a string or number depending on the source list,
// the display names are always strings.
export interface SelectedUsersPayload {
  selectedUsers: (string | number)[];
  selectedUsersShow: string[];
}

/**
 * App-wide broadcast Subjects + ad-hoc cross-component shared state, split
 * out of DataService. DataService keeps every one of these as a
 * passthrough (a getter for the Subjects, a get/set pair for the plain
 * mutable fields) since they're read and written directly
 * (dataProvider.events, dataProvider.unread, ...) across many components —
 * no consumer needed to change when this moved.
 */
@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  // نواقل بث عامة على مستوى التطبيق — Subject بدل EventEmitter لأنها ليست
  // ربط @Output لمكوّن، بل قنوات بث يشترك بها عدة مستهلكين مستقلين
  public events: Subject<number> = new Subject();
  public language: Subject<string> = new Subject();
  public selectedUsers: Subject<SelectedUsersPayload> = new Subject();

  // قناة اتصال مخصصة لنقل الخبر المعدل أو الجديد
  public newsUpdated = new Subject<Record<string, unknown>>();

  public uploadProgress: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  unread = false;
  private_message = false;
  deactivate_date: string = '';

  constructor() {
    this.language.subscribe(res => {
      environment.lang_code = res;
    });
  }

  getStatusMessage(event: any) {
    let status;
    switch (event.type) {
      case HttpEventType.UploadProgress:
        status = Math.round((100 * event.loaded) / event.total);
        this.uploadProgress.next(status);
        this.events.next(status);
        return status;

      case HttpEventType.Response:
        return `Done`;
    }
  }
}
