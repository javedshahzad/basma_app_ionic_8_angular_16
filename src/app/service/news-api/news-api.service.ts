import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ApiClient } from '../api-client/api-client.service';
import { DataService } from '../data/data.service';
import { DatabaseService } from '../database/database.service';
import { UserDetails } from '../../model/logged-in-user.model';
import { SafeHtml } from '@angular/platform-browser';

export interface News {
  id?: string | number;
  title?: string;
  // Raw string from the backend, replaced in-place with sanitized HTML by
  // news.page.ts's urlify() once rendered.
  content?: string | SafeHtml;
  news_description?: string;
  ago?: string;
  video_url?: string;
  news_image?: string;
  pagetitle?: string;
  school_logo?: string;
  school_name?: string;
  already_like?: string | boolean;
  total_likes?: string | number;
  school_id?: string | number;
  user_id?: string | number;
  user_no?: string | number;
  created_by?: string | number;
}

interface GetNewsJoinHttpResponse {
  success?: boolean;
  news?: News[];
}

interface LikePostResponse {
  session: boolean;
  message?: string;
}

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
  // Resolves News[] on success, but falls through to resolve the raw envelope
  // on failure (pre-existing: the success branch never `return`s after its
  // own resolve(), so a second resolve() always runs too — harmless since a
  // settled promise ignores later resolve() calls, but it means the failure
  // path really does resolve a different shape than the success path).
  getNewsJoin(start: number, newsPerPage: number, userDeatils: UserDetails | undefined, countryCode: string): Promise<News[] | GetNewsJoinHttpResponse> {
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


          this.http.get<GetNewsJoinHttpResponse>(url, { headers: header }).subscribe((response) => {
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
  likeNewsPost(data: { session_id: string; news_id: string | number; user_no: string | number }): Promise<LikePostResponse> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ session?: boolean; success?: boolean; msg?: string }>(data, 'likeNewsPost').then((response) => {
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
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  /**
   * Dislike the news post
   * @param data user_no, news_id, session_id
   */
  dislikeNewsPost(data: { session_id: string; news_id: string | number; user_no: string | number }): Promise<LikePostResponse> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ session?: boolean; success?: boolean; msg?: string }>(data, 'dislikeNewsPost').then((response) => {
        if (response) {
          if (!response.session) {
            resolve({ session: false, message: response.msg });
          } else if (response.success) {
            // Was `resolve({ session: true, data: response.courses })` — a
            // copy-paste leftover from a courses-api method; `.courses`
            // never existed on this response and no caller read `.data`
            // here, so this now matches the (identical) likeNewsPost shape.
            resolve({ session: true, message: response.msg });
          } else {
            reject(response.msg)
          }
        } else {
          reject(this.dataService.lang.networkNotWorking);
        }
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }

  deleteNews(data: Record<string, unknown>, note_id: string | number): Promise<LikePostResponse> {
    return new Promise((resolve, reject) => {
      this.apiClient.postRequest<{ session?: boolean; success?: boolean; msg?: string }>(data, 'delete_news/' + note_id).then((response) => {
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
      }).catch((error) => this.apiClient.handleApiError(error, reject, this.dataService.lang.usnexpectedError))
    })
  }
}
