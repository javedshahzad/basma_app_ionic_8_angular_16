import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiClient } from '../api-client/api-client.service';

@Injectable({
  providedIn: 'root'
})
export class BulletinsApiService {

  constructor(
    private http: HttpClient,
    private apiClient: ApiClient
  ) { }

  getBulletins(data): Promise<any> {
    return new Promise((resolve, reject) => {
      // console.log(data);
      this.apiClient.postRequest(data, 'getBulletins').then((response: any) => {
        if (response) {
            resolve({ session: true, data: response.response});
        } else {
            reject(response.msg)
        }
      }).catch((error) => {
        console.log(error);
      })
    })
  }

  shareBulletins(data): Promise<any> {
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

      this.http.post( environment.serverURL + 'shareBulletins',body, { headers: header }).subscribe((response: any) => {
        if (response) {
            resolve({ session: true, data: response.response,message:response.msg});
        } else {
            reject(response.msg)
        }
      },(error) => {
        console.log(error);
      });
    })
  }
}
