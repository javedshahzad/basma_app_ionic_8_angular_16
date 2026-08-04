import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SQLite, SQLiteObject } from '@awesome-cordova-plugins/sqlite/ngx';
import { Platform } from '@ionic/angular';
import { Storage } from '@ionic/storage';

@Injectable({
  providedIn: 'root'
})
export class StudentDataService {
  student: any;
  studentList: any = [];
  studentNote: any = [];
  staticalData: any = [];

  constructor(public http: HttpClient, public sqlite: SQLite, public platform: Platform,
              private storage: Storage) {
  }

  async checkStudent(student) {
    await this.platform.ready();
    const data = await this.storage.get('offlineStudent');
    this.studentList = data || [];
    this.studentList[student.sid] = student;
    await this.storage.set('offlineStudent', this.studentList);
  }

  async checkStudentNotes(note, student_id) {
    await this.platform.ready();
    const data = await this.storage.get('offlineStudentNote');
    this.studentNote = data || [];
    this.studentNote[student_id] = note;
    await this.storage.set('offlineStudentNote', this.studentNote);
  }

  async getStudent(student_id): Promise<any> {
    await this.platform.ready();
    const res = await this.storage.get('offlineStudent');
    if (res) {
      this.studentList = res;
      const data = this.studentList[student_id];
      if (data) {
        return data;
      }
      throw data;
    }
    throw 'data';
  }

  async getStudentNote(student_id): Promise<any> {
    await this.platform.ready();
    const res = await this.storage.get('offlineStudentNote');
    if (res) {
      this.studentNote = res;
      const data = this.studentNote[student_id];
      if (data) {
        return data;
      }
      throw data;
    }
    throw 'data';
  }

  async setStaticalData(user_ID, data) {
    await this.platform.ready();
    const res = await this.storage.get('offlinestatical');
    this.staticalData = res || [];
    this.staticalData[user_ID] = data;
    await this.storage.set('offlinestatical', this.staticalData);
  }

  async getOfflineStatical(user_ID): Promise<any> {
    await this.platform.ready();
    const res = await this.storage.get('offlinestatical');
    if (res) {
      console.log('offlinestaticalGet', res);
      return res[user_ID];
    }
    return [];
  }

}
