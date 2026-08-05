import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { Network } from '@awesome-cordova-plugins/network/ngx';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../model/api-response.model';

/**
 * Generic HTTP plumbing shared by the domain services: network-status
 * check, form-url-encoding, and the raw POST-and-parse used by most
 * backend calls.
 */
@Injectable({
  providedIn: 'root'
})
export class ApiClient {

  constructor(
    private http: HttpClient,
    private platform: Platform,
    private network: Network
  ) { }

  /**
   * Check whether network is available or not
   */
  getNetworkInformation(): Promise<boolean> {
    return new Promise((resolve) => {

      // Native app (Cordova/Capacitor)
      if (this.platform.is('cordova') || this.platform.is('capacitor')) {
        const isOnline =
          this.network.type !== this.network.Connection.NONE &&
          this.network.type !== this.network.Connection.UNKNOWN;

        resolve(isOnline);
        return;
      }

      // Browser/Desktop
      resolve(navigator.onLine);
    });
  }

  /** Function to convert object into param string
   * @param {Object} data - contains the properties to post to API
   * @returns Param string
  */
  makeObjectToUrlParams(data: Record<string, unknown>) {
    let body = new HttpParams();
    Object.keys(data).forEach(function (key) {
      body = body.append(key, data[key] as string | number | boolean);
    });
    return body;
  }

  /** Post request function.
   * @param {Object} data - contains the properties to post to API
   * @param {String} slug - contains the API method to call
   * @returns Success or error
   */
  postRequest<T = ApiResponse>(data: Record<string, unknown>, slug: string): Promise<T | false> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          let header = new HttpHeaders();
          data.lang_code = environment.lang_code;

          let body: HttpParams = this.makeObjectToUrlParams(data);
          header.append('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
          this.http.post<T>(environment.serverURL + slug, body, { headers: header }).subscribe((response) => {
            if (response) {
              if (response['_body'] != '') {
                let resObj = response;
                resolve(resObj)
              } else {
                reject("Unable to find any record");
              }
            }
          }, (error) => {
            reject(error);
          })
        } else {
          resolve(false);
        }
      })
    })
  }
}
