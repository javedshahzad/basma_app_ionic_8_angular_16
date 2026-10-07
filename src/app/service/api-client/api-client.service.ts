import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Platform } from '@ionic/angular';
import { isNetworkConnected } from '../network-status';
import { reportHttpFailure } from './http-failure-report';
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
      return (await isNetworkConnected());
    }

    // Browser/Desktop
    return navigator.onLine;
  }

  /** Function to convert object into param string
   * @param {Object} data - contains the properties to post to API
   * @returns Param string
   *
   * Keys whose value is null/undefined are skipped entirely rather than
   * appended -- HttpParams.append() otherwise coerces them to the literal
   * string "undefined"/"null" (confirmed live: an optional field built as
   * `field: value || undefined`, e.g. a case's summary left blank, arrived
   * at the backend as the actual text "undefined" instead of being omitted).
   * The `field || undefined` pattern is common across the domain services'
   * optional params, so this is the one place to fix it for all of them.
  */
  makeObjectToUrlParams(data: Record<string, unknown>) {
    let body = new HttpParams();
    Object.keys(data).forEach(function (key) {
      const value = data[key];
      if (value === null || value === undefined) return;
      body = body.append(key, value as string | number | boolean);
    });
    return body;
  }

  /**
   * Shared `.catch()` handler for the domain services' hand-rolled
   * `new Promise((resolve, reject) => {...})` API wrappers: logs the error,
   * then rejects with the server-provided message if there is one, else
   * `fallbackMessage` (typically `dataService.lang.usnexpectedError`), else
   * the raw error itself. Centralizing this also rules out the
   * missing-reject "hanging promise" bug class by construction — every
   * caller of this helper always settles the promise.
   */
  handleApiError(error: unknown, reject: (reason?: unknown) => void, fallbackMessage?: unknown): void {
    console.log(error);
    const message = (error as { message?: string })?.message;
    if (message != undefined && message != '' && message != null) {
      reject(message);
    } else if (fallbackMessage !== undefined) {
      reject(fallbackMessage);
    } else {
      reject(error);
    }
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
              if ((response as any)['_body'] != '') {
                let resObj = response;
                resolve(resObj)
              } else {
                reject("Unable to find any record");
              }
            }
          }, (error) => {
            // The empty-body "Unable to find any record" reject above is a normal no-data
            // outcome and is not reported; only real transport/HTTP failures are.
            reportHttpFailure(error, slug);
            reject(error);
          })
        } else {
          resolve(false);
        }
      })
    })
  }

  /**
   * Same as postRequest(), but sends a real JSON body instead of
   * form-urlencoded -- needed for endpoints whose payload includes a
   * nested object (e.g. a WebAuthn response) that wouldn't survive
   * HttpParams serialization intact.
   * @param {Object} data - contains the properties to post to API
   * @param {String} slug - contains the API method to call
   * @returns Success or error
   */
  postJsonRequest<T = ApiResponse>(data: Record<string, unknown>, slug: string): Promise<T | false> {
    return new Promise((resolve, reject) => {
      this.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          const header = new HttpHeaders({ 'Content-Type': 'application/json' });
          const body = { ...data, lang_code: environment.lang_code };
          this.http.post<T>(environment.serverURL + slug, body, { headers: header }).subscribe((response) => {
            if (response) {
              resolve(response);
            } else {
              reject('Unable to find any record');
            }
          }, (error) => {
            reportHttpFailure(error, slug);
            reject(error);
          })
        } else {
          resolve(false);
        }
      })
    })
  }
}
