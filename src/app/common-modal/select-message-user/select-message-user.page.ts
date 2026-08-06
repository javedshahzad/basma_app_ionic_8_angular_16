import { Component, OnInit, NgZone, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { NavController, NavParams, AlertController, Platform } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Router, ActivatedRoute, NavigationExtras } from '@angular/router';
import { DataService } from '../../service/data/data.service';
import { Location } from '@angular/common';
import { SearchApiService } from '../../service/search-api/search-api.service';
import { StorageService } from '../../service/storage.service';
import { SchoolDirectoryApiService } from '../../service/school-directory-api/school-directory-api.service';

@Component({
  selector: 'app-select-message-user',
  templateUrl: './select-message-user.page.html',
  styleUrls: ['./select-message-user.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class SelectMessageUserPage implements OnInit {
  trackByIndex(index: number): number {
    return index;
  }
  userDetails: any;
  selectedUsers: any = [];
  selectedUsersShow: any = [];
  users: any = [];
  allUsers: any = [];
  lang: any;

  constructor(
    public navCtrl: NavController,
    public dataProvider: DataService,
    public translate: TranslateService,
    public alertCtrl: AlertController,
    private route: ActivatedRoute,
    private router: Router,
    public zone: NgZone,
    private location: Location,
    public platform: Platform,
    private searchApi: SearchApiService,
    private storageSr: StorageService,
    private schoolDirectoryApi: SchoolDirectoryApiService,
    private cdr: ChangeDetectorRef
  ) {
    this.route.queryParams.subscribe((params: any) => {
      this.selectedUsers = params.selectedUsers ? params.selectedUsers : [];
      this.selectedUsersShow = params.selectedUsersShow;
      const navigation = this.router.getCurrentNavigation();
      if (navigation && navigation.extras && navigation.extras.state) {
        //  		 this.users = navigation.extras.state;
        // this.allUsers = this.allUsers.concat(this.users.splice(0, 20));
      }
      this.cdr.markForCheck();
    });
    this.translate.get('alertmessages').subscribe(response => {
      this.lang = response;
      this.cdr.markForCheck();
    });
  }

  async ngOnInit() {
    const userData = await this.storageSr.get('userloggedin');
    if (userData) {
      this.userDetails = userData;
      this.getUsers();
    }
    console.log(this.users);
    this.cdr.markForCheck();
  }
  async getUsers() {
    let data = {
      school_id: this.userDetails.details.school_id
    };
    try {
      const res = await this.dataProvider.run(() => this.schoolDirectoryApi.getAllSchoolUsers(data));
      console.log('seminar class', res);
      if (res.data) {
        this.users = res.data;
        this.allUsers = this.allUsers.concat(this.users.splice(0, 20));
      }
    } catch (error) {
      this.dataProvider.showToast(error);
      console.log(error);
    }
    this.cdr.markForCheck();
  }

  filterList(event) {
    //this.selectTopic=[];
    let input = (<HTMLInputElement>document.getElementById('search')).value;
    console.log(input);

    let data = {
      input: input,
      school_id: this.userDetails.details.school_id
    };
    this.searchApi
      .searchAllUser(data)
      .then(resp => {
        if (resp.data) {
          this.users = resp.data;
          if (this.users.length > 1) {
            this.allUsers = this.users.splice(0, 20);
          } else {
            this.allUsers = this.users;
          }
        }
        this.cdr.markForCheck();
      })
      .catch(arr => {
        console.log(arr);
        this.cdr.markForCheck();
      });
  }

  selectUser(users, eve, id) {
    console.log(users);
    let isPresent = false;
    let ind;
    for (let i = 0; i < this.selectedUsers.length; i++) {
      if (this.selectedUsers[i] == users.user_no) {
        isPresent = true;
        ind = i;
      }
    }
    if (eve.detail.checked == true) {
      if (!isPresent) {
        if (users.user_no != this.userDetails.details.user_no) {
          this.selectedUsers.push(users.user_no);
        } else {
          this.dataProvider.showToast(this.lang.same_user);
          let elem = <HTMLFormElement>document.getElementById('ch' + id);
          elem['checked'] = false;
        }
      }
    } else {
      if (isPresent) {
        this.selectedUsers.splice(ind, 1);
      }
    }
    for (let i = 0; i < this.selectedUsersShow.length; i++) {
      if (this.selectedUsersShow[i] == users.username) {
        isPresent = true;
        ind = i;
      }
    }
    if (eve.detail.checked == true) {
      if (!isPresent) {
        if (users.username != this.userDetails.details.username) {
          this.selectedUsersShow.push(users.username);
        } else {
          this.dataProvider.showToast(this.lang.same_user);
          let elem = <HTMLFormElement>document.getElementById('ch' + id);
          elem['checked'] = false;
        }
      }
    } else {
      if (isPresent) {
        this.selectedUsersShow.splice(ind, 1);
      }
    }
    console.log(this.selectedUsers, 'selectedUsersShow', this.selectedUsersShow);
  }

  doInfinite(infiniteScroll: any) {
    setTimeout(() => {
      this.allUsers = this.allUsers.concat(this.users.splice(0, 20));
      infiniteScroll.target.complete();
    }, 500);
  }

  sendUser() {
    // const navigation: NavigationExtras = {
    //          state : this.selectedUsers
    //        };
    //  this.zone.run(() => {
    //    this.router.navigate(['sendmessage'], navigation);
    //  });
    let data = {
      selectedUsers: this.selectedUsers,
      selectedUsersShow: this.selectedUsersShow
    };
    this.dataProvider.selectedUsers.next(data);
    this.location.back();
  }
}
