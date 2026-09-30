import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  constructor(public http: HttpClient, public platform: Platform,
              private storage: Storage) {
  }

  async checkStudent(student: any) {
    await this.platform.ready();
    const data = await this.storage.get('offlineStudent');
    this.studentList = data || [];
    this.studentList[student.sid] = student;
    await this.storage.set('offlineStudent', this.studentList);
  }

  async checkStudentNotes(note: any, student_id: any) {
    await this.platform.ready();
    const data = await this.storage.get('offlineStudentNote');
    this.studentNote = data || [];
    this.studentNote[student_id] = note;
    await this.storage.set('offlineStudentNote', this.studentNote);
  }

  async getStudent(student_id: any): Promise<any> {
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

  async getStudentNote(student_id: any): Promise<any> {
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

  async setStaticalData(user_ID: any, data: any) {
    await this.platform.ready();
    const res = await this.storage.get('offlinestatical');
    this.staticalData = res || [];
    this.staticalData[user_ID] = data;
    await this.storage.set('offlinestatical', this.staticalData);
  }

  async getOfflineStatical(user_ID: any): Promise<any> {
    await this.platform.ready();
    const res = await this.storage.get('offlinestatical');
    if (res) {
      console.log('offlinestaticalGet', res);
      return res[user_ID];
    }
    return [];
  }

}
