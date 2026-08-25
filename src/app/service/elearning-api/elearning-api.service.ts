import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';

export interface ElearningMaterial {
  id?: string | number;
  material_title?: string;
  material_description?: string;
  material_video_file?: string;
  material_video_link?: string;
  video_thumb?: string;
  related_videos?: ElearningMaterial[];
}

export interface ElearningCategory {
  cat_title?: string;
  materials?: ElearningMaterial[];
}

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

  getElearningMaterials(schoolId: string | number, country_code?: string): Promise<ElearningCategory[]> {
    return new Promise((resolve, reject) => {
      this.apiClient.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');

          let url = environment.serverURL + 'getElearningMaterials/' + schoolId + ((country_code && typeof country_code !== 'undefined') ? '?country_code=' + country_code : '');
          this.http.get<{ success?: boolean; materials?: ElearningCategory[] }>(url, { headers: header }).subscribe((response) => {
            if (response.success) {
              resolve(response.materials || []);
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
  getMaterialDetails(materialId: string | number): Promise<ElearningMaterial> {
    return new Promise((resolve, reject) => {
      this.apiClient.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');
          this.http.get<{ success?: boolean; material?: ElearningMaterial }>(environment.serverURL + 'getMaterialDetails/' + materialId, { headers: header }).subscribe((response) => {
            if (response.success && response.material) {
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
