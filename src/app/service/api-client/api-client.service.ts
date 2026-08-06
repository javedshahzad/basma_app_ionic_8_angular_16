import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { Network } from '@capacitor/network';
import * as Sentry from '@sentry/angular';
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
    private platform: Platform
  ) { }

  /**
   * Check whether network is available or not
   */
  async getNetworkInformation(): Promise<boolean> {
    // Native app (Cordova/Capacitor)
    if (this.platform.is('cordova') || this.platform.is('capacitor')) {
      return (await Network.getStatus()).connected;
    }

    // Browser/Desktop
    return navigator.onLine;
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
            // Only real transport/HTTP failures are Sentry-worthy here — the
            // empty-body "Unable to find any record" reject above is a normal
            // no-data outcome, not a bug, and must not be captured.
            Sentry.captureException(error, { extra: { slug } });
            reject(error);
          })
        } else {
          resolve(false);
        }
      })
    })
  }
}
