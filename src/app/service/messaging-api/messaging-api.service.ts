import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpRequest } from '@angular/common/http';
import { map, tap, last } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DataService } from '../data/data.service';

/**
 * School-wide message/notification broadcast, split out of DataService.
 * Unlike the rest of the *-api services this returns an Observable (the
 * caller subscribes directly for upload progress), and depends on
 * DataService.getStatusMessage() for upload-progress reporting (which
 * also pushes to DataService's own shared uploadProgress/events Subjects
 * that other pages subscribe to directly).
 */
@Injectable({
  providedIn: 'root'
})
export class MessagingApiService {

  constructor(
    private http: HttpClient,
    private dataService: DataService
  ) { }

  sendMessage(data: any, school_id: string | number) {
    let header = new HttpHeaders();
    header.append('Content-Type', 'application/json');
    data.lang_code = environment.lang_code;
    let req = new HttpRequest('POST', environment.serverURL + 'sendMessage/' + school_id, data, {
      responseType: 'arraybuffer',
      reportProgress: true
    });

    return this.http.request(req).pipe(
      map(event => this.dataService.getStatusMessage(event)),
      tap(message => message),
      last()
    );
  }
}
