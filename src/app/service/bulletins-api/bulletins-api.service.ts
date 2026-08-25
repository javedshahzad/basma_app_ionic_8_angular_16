import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpRequest } from '@angular/common/http';
import { map, tap, last } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';
import { ApiResponse } from '../../model/api-response.model';

export interface BulletinDocumentFile {
  is_img?: boolean;
  extension?: string;
  url?: string;
  url_original?: string;
}

export interface BulletinDocuments {
  pdf?: string;
  files?: BulletinDocumentFile[];
}

export interface Bulletin {
  id?: string | number;
  is_closed?: string;
  created_by?: string | number;
  created_by_username?: string;
  created_by_user_pic?: string;
  created_at?: string;
  bulletin_title?: string;
  send_by?: string | number;
  send_by_username?: string;
  documents?: BulletinDocuments;
}

@Injectable({
  providedIn: 'root'
})
export class BulletinsApiService {

  constructor(
    private http: HttpClient,
    private apiClient: ApiClient,
    private dataService: DataService
  ) { }

  getBulletins(data: Record<string, unknown>): Promise<ApiResponse<Bulletin[]>> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest<ApiResponse<Bulletin[]>>(data, 'getBulletins').then((response) => {
        if (response) {
            resolve({ session: true, data: response.response});
        } else {
            reject(undefined)
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  shareBulletins(data: Record<string, unknown> & { users: Record<string, string | number> }): Promise<ApiResponse> {
    return new Promise((resolve, reject) => {
       let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');
          data.lang_code = environment.lang_code;
          let body: HttpParams = this.apiClient.makeObjectToUrlParams(data);

           Object.keys(data.users).map((key) => {
             console.log('key',key);
              body=body.append('shareto_user_no'+'['+ key+']' , data.users[key]);
          })
              // console.log(body);

      this.http.post<{ response?: string; msg?: string } | null>(environment.serverURL + 'shareBulletins', body, { headers: header }).subscribe((response) => {
        if (response) {
            resolve({ session: true, data: response.response, message: response.msg });
        } else {
            reject(this.dataService.lang.usnexpectedError)
        }
      }, (error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError));
    })
  }

  createBulletins(data: any) {
    let header = new HttpHeaders();
    header.append('Content-Type', 'application/json');
    data.lang_code = environment.lang_code;
    let req = new HttpRequest('POST', environment.serverURL + 'createBulletins', data, {
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
