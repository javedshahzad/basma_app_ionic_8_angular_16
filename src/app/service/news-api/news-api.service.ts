import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';
import { DatabaseService } from '../database/database.service';

/**
 * News feed HTTP calls, split out of DataService. Depends on DataService
 * for `lang` (error-message fallbacks) and DatabaseService for the
 * offline-cache fallback in getNewsJoin.
 */
@Injectable({
  providedIn: 'root'
})
export class NewsApiService {

  constructor(
    private http: HttpClient,
    private apiClient: ApiClient,
    private dataService: DataService,
    private dbProvider: DatabaseService
  ) { }

  /** Get news from API with paging.
   * @param {number} start - starting point of news list
   * @param {number} newsPerPage - how many news in one page
   * @param {object} userDeatils logged in user details
   * @param {char} countrycode - to get news of current locaion
   * @returns Array of News as per location or error
  */
  getNewsJoin(start: number, newsPerPage: number, userDeatils: any,countryCode): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.getNetworkInformation().then((isNetworkAvailable) => {
        if (isNetworkAvailable) {
          let header = new HttpHeaders();
          header.append('Content-Type', 'application/json');
          let url = '';

          if (userDeatils) {
            url = environment.serverURL + 'getNewsjoin/' + start + '/' + newsPerPage + '/desc/' + userDeatils.user_no;
          } else {
            url = environment.serverURL + 'getNewsjoin/' + start + '/' + newsPerPage + '/desc';
          }

          url = `${url}?school_id=${userDeatils?.school_id}&user_no=${userDeatils?.user_no}`
          if(countryCode && typeof countryCode !=='undefined'){
             url= url+'&code='+countryCode;
          }


          this.http.get(url, { headers: header }).subscribe((response: any) => {
            if (response.success) {
              if (response.news.length > 20) {
                this.dbProvider.insertNews(response.news.slice(0, 20));
              } else {
                this.dbProvider.insertNews(response.news);
              }
              resolve(response.news);
            }
            resolve(response);
          }, (error) => {
            if (error.message != undefined && error.message != '' && error.message != null) {
              reject(error.message)
            } else {
              reject(this.dataService.lang.usnexpectedError)
            }
          })
        } else {
          this.dbProvider.getNews().then((news) => {
            resolve(news);
          }).catch((err) => {
            reject(err);
          })
        }
      })
    })
  }

  /**
   * Like the news post
   * @param data user_no, news_id, session_id
   */
  likeNewsPost(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'likeNewsPost').then((response: any) => {
        if (response) {
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            resolve({ session: true, message: response.msg });
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.dataService.lang.networkNotWorking);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.dataService.lang.usnexpectedError)
        }
      })
    })
  }

  /**
   * Dislike the news post
   * @param data user_no, news_id, session_id
   */
  dislikeNewsPost(data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'dislikeNewsPost').then((response: any) => {
        if (response) {
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            resolve({ session: true, data: response.courses });
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.dataService.lang.networkNotWorking);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.dataService.lang.usnexpectedError)
        }
      })
    })
  }

  deleteNews(data: any , note_id: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest(data, 'delete_news/' + note_id).then((response: any) => {
        if (response) {
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            resolve({ session: true, message: response.msg });
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.dataService.lang.networkNotWorking);
        }
      }).catch((error) => {
        console.log(error);
        if (error.message != undefined && error.message != '' && error.message != null) {
          reject(error.message)
        } else {
          reject(this.dataService.lang.usnexpectedError)
        }
      })
    })
  }
}
