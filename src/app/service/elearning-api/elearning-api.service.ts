import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';

/**
 * E-learning material HTTP calls, split out of DataService. Depends on
 * DataService for `lang` (error-message fallbacks).
 */
@Injectable({
  providedIn: 'root'
})
export class ElearningApiService {

  constructor(
    private http: HttpClient,
    private apiClient: ApiClient,
    private dataService: DataService
  ) { }

  getElearningMaterials(schoolId: any, country_code): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');

          let url = environment.serverURL + 'getElearningMaterials/' + schoolId + ((country_code && typeof country_code !== 'undefined') ? '?country_code=' + country_code : '');
          this.http.get(url, { headers: header }).subscribe((response: any) => {
            if (response.success) {
              resolve(response.materials);
            } else {
              reject("Server is not responding")
            }
          }, (error) => {
            if (error.message != undefined && error.message != '' && error.message != null) {
              reject(error.message)
            } else {
              reject(this.dataService.lang.usnexpectedError)
            }
          })
        } else {
          reject(this.dataService.lang.networkNotWorking);
        }
      })
    })
  }

  /** Get E-Learning material data from API.
    * @returns Array of material data or error
   */
  getMaterialDetails(materialId: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');
          this.http.get(environment.serverURL + 'getMaterialDetails/' + materialId, { headers: header }).subscribe((response: any) => {
            if (response.success) {
              resolve(response.material);
            } else {
              reject("Server is not responding")
            }
          }, (error) => {
            if (error.message != undefined && error.message != '' && error.message != null) {
              reject(error.message)
            } else {
              reject(this.dataService.lang.usnexpectedError)
            }
          })
        } else {
          reject(this.dataService.lang.networkNotWorking);
        }
      })
    })
  }
}
