import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private sqlite: SQLiteConnection;
  public db: SQLiteDBConnection;
  private isNative: boolean = false;

  constructor(public platform: Platform) {
    this.isNative = Capacitor.isNativePlatform();
    if (this.isNative) {
      // تهيئة اتصال Capacitor SQLite
      this.sqlite = new SQLiteConnection(CapacitorSQLite);
    }
  }

  /**
   * Open the local database
   */
  async openDataBase(): Promise<any> {
    return new Promise(async (resolve, reject) => {
      await this.platform.ready();
      if (this.isNative) {
        try {
          // التحقق مما إذا كان الاتصال موجوداً مسبقاً لتجنب الأخطاء
          const isConn = (await this.sqlite.isConnection('attendance.db', false)).result;
          if (isConn) {
            this.db = await this.sqlite.retrieveConnection('attendance.db', false);
          } else {
            this.db = await this.sqlite.createConnection('attendance.db', false, 'no-encryption', 1, false);
          }
          
          await this.db.open();
          resolve(true);
        } catch (error) {
          console.error("Error opening DB: ", error);
          reject(false);
        }
      } else {
        resolve(true); // تخطي في حالة المتصفح
      }
    });
  }

  /**
   * Create classes, students, private_message, parent_connect, news table 
   */
  async createTable(): Promise<any> {
    if (!this.isNative) return Promise.resolve(true);

    try {
      const classesTable = `CREATE TABLE IF NOT EXISTS classes (
                              cid INT PRIMARY KEY, name VARCHAR(50), desc VARCHAR(50), code VARCHAR(10)
                            );`;
      const studentsTable = `CREATE TABLE IF NOT EXISTS students (
                              sid INT, name VARCHAR(50), pic TEXT, cid INT, add_ranking FLOAT,
                              medical_days INTEGER, suspend_days INTEGER, total_absent INTEGER, 
                              unacceptable_absent_days INTEGER, total_delay INTEGER, zero INTEGER, 
                              one INTEGER, delay_rule INTEGER
                            );`;
      const privateMsgTable = `CREATE TABLE IF NOT EXISTS private_message (
                                ID BIGINT PRIMARY KEY, date datetime, first_name varchar(50),
                                notification TEXT, pic TEXT, status INT, title VARCHAR(50),
                                user_no INT, user_right VARCHAR(5), user_type INT
                              );`;
      const parentConnTable = `CREATE TABLE IF NOT EXISTS parent_connect (
                                id BIGINT PRIMARY KEY, created datetime, first_name varchar(50),
                                last_name varchar(50), message VARCHAR(150), name VARCHAR(150),
                                parent_user_no INT, pic TEXT, school_id INT, ticket_status INT,
                                ticket_status_updated_by BIGINT, title VARCHAR(50), updated_time TIMESTAMP
                              );`;
      const newsTable = `CREATE TABLE IF NOT EXISTS news (
                          id INT PRIMARY KEY, ago VARCHAR(20), already_like varchar(10),
                          content TEXT, detail TEXT, school_id INT, news_image TEXT,
                          school_logo TEXT, school_name TEXT, status INT, title VARCHAR(150), total_likes INT
                        );`;

      // تنفيذ الجداول بالتسلسل
      await this.db.execute(classesTable);
      await this.db.execute(studentsTable);
      await this.db.execute(privateMsgTable);
      await this.db.execute(parentConnTable);
      await this.db.execute(newsTable);
      
      console.log('All Tables created successfully');
      return Promise.resolve(true);
    } catch (error) {
      console.error("Error creating tables: ", error);
      return Promise.reject(false);
    }
  }

  /**
   * insert or update the news locally
   */
  async insertNews(recentNews: Array<any>) {
    if (!this.isNative) return;
    try {
      await this.db.run('DELETE FROM news');
      for (let news of recentNews) {
        const query = `INSERT INTO news (id, ago, already_like, content, detail, school_id, news_image, school_logo, school_name, status, title, total_likes) 
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [news.id, news.ago, news.already_like, news.content, news.detail, news.school_id, news.news_image, news.school_logo, news.school_name, news.status, news.title, news.total_likes];
        await this.db.run(query, values);
      }
      console.log("News inserted successfully");
    } catch (error) {
      console.error("Error inserting news: ", error);
    }
  }

  /**
   * Get latest local news
   */
  async getNews(): Promise<any> {
    if (!this.isNative) return Promise.resolve([]);
    try {
      const response = await this.db.query('SELECT * FROM news');
      let news = response.values || [];
      
      // معالجة البيانات كما كانت في النسخة القديمة
      news = news.map(data => {
        if (data.news_image) data.news_image = './assets/imgs/no-preview.png';
        data.school_logo = '';
        return data;
      });
      return Promise.resolve(news);
    } catch (error) {
      console.error(error);
      return Promise.reject("Some problem exist try again later");
    }
  }

  /**
   * insert or update the classes locally
   */
  async insertClasses(classes: Array<any>) {
    if (!this.isNative) return;
    try {
      for (let data of classes) {
        const query = `INSERT OR REPLACE INTO classes (cid, name, desc, code) VALUES (?, ?, ?, ?)`;
        const values = [data.cid, data.name, data.desc, data.code];
        await this.db.run(query, values);
      }
    } catch (error) {
      console.error("Error inserting classes: ", error);
    }
  }

  /**
   * Return the classes stored locally
   */
  async getClasses(): Promise<any> {
    if (!this.isNative) return Promise.resolve([]);
    try {
      const response = await this.db.query('SELECT * FROM classes');
      return Promise.resolve(response.values || []);
    } catch (error) {
      console.error(error);
      return Promise.reject("Some problem exist try again later");
    }
  }

  /**
   * Insert students locally
   */
  async insertStudentList(students: Array<any>, delay_rule: any) {
    if (!this.isNative) return;
    try {
      for (let student of students) {
        student.add_ranking = student.add_ranking || 0;
        student.total_delay = student.total_delay || 0;
        student.useedforabsent = student.useedforabsent || { zero: 0, one: 0 };

        const checkRes = await this.db.query('SELECT sid FROM students WHERE sid = ? AND cid = ?', [student.sid, student.cid]);
        
        if (checkRes.values && checkRes.values.length > 0) {
          const updateQuery = `UPDATE students SET name = ?, pic = ?, add_ranking = ?, medical_days = ?, suspend_days = ?, total_absent = ?, unacceptable_absent_days = ?, total_delay = ?, zero = ?, one = ?, delay_rule = ? WHERE sid = ? AND cid = ?`;
          const updateValues = [student.name, student.pic, student.add_ranking, student.medical_days, student.suspend_days, student.total_absent, student.unacceptable_absent_days, student.total_delay, student.useedforabsent.zero, student.useedforabsent.one, delay_rule, student.sid, student.cid];
          await this.db.run(updateQuery, updateValues);
        } else {
          const insertQuery = `INSERT INTO students (sid, name, pic, cid, add_ranking, medical_days, suspend_days, total_absent, unacceptable_absent_days, total_delay, zero, one, delay_rule) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
          const insertValues = [student.sid, student.name, student.pic, student.cid, student.add_ranking, student.medical_days, student.suspend_days, student.total_absent, student.unacceptable_absent_days, student.total_delay, student.useedforabsent.zero, student.useedforabsent.one, delay_rule];
          await this.db.run(insertQuery, insertValues);
        }
      }
    } catch (error) {
      console.error("Student insert/update error: ", error);
    }
  }

  /**
   * Get the student list registered for particular course/class
   */
  async getStudentList(cid): Promise<any> {
    if (!this.isNative) return Promise.resolve([]);
    try {
      const response = await this.db.query('SELECT * FROM students WHERE cid = ?', [cid]);
      let students = response.values || [];
      students = students.map(student => {
        student.sheet = [];
        student.useedforabsent = { zero: student.zero, one: student.one };
        return student;
      });
      return Promise.resolve(students);
    } catch (error) {
      console.error(error);
      return Promise.reject("Some problem exist try again later");
    }
  }

  async getStudent(sid): Promise<any> {
    if (!this.isNative) return Promise.resolve([]);
    try {
      const response = await this.db.query('SELECT * FROM students WHERE sid = ?', [sid]);
      let students = response.values || [];
      students = students.map(student => {
        student.sheet = [];
        student.useedforabsent = { zero: student.zero, one: student.one };
        return student;
      });
      return Promise.resolve(students);
    } catch (error) {
      console.error(error);
      return Promise.reject("Some problem exist try again later");
    }
  }

  /**
   * insert or update the private messages locally
   */
  async insertPrivateMessages(messages: Array<any>) {
    if (!this.isNative) return;
    try {
      for (let message of messages) {
        const query = `INSERT OR REPLACE INTO private_message (ID, date, first_name, notification, pic, status, title, user_no, user_right, user_type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [message.ID, message.date, message.first_name, message.notification, message.pic, message.status, message.title, message.user_no, message.user_right, message.user_type];
        await this.db.run(query, values);
      }
    } catch (error) {
      console.error("Error inserting private messages: ", error);
    }
  }

  /**
   * Get the Private messages
   */
  async getPrivateMessages(): Promise<any> {
    if (!this.isNative) return Promise.resolve([]);
    try {
      const response = await this.db.query('SELECT * FROM private_message');
      return Promise.resolve(response.values || []);
    } catch (error) {
      console.error(error);
      return Promise.reject("Some problem exist try again later");
    }
  }

  /**
   * insert or update the Parent connect support ticket
   */
  async insertParentConnectMessages(messages: Array<any>) {
    if (!this.isNative) return;
    try {
      for (let message of messages) {
        const query = `INSERT OR REPLACE INTO parent_connect (id, created, first_name, last_name, message, name, parent_user_no, pic, school_id, ticket_status, ticket_status_updated_by, title, updated_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [message.id, message.created, message.first_name, message.last_name, message.message, message.name, message.parent_user_no, message.pic, message.school_id, message.ticket_status, message.ticket_status_updated_by, message.title, message.updated_time];
        await this.db.run(query, values);
      }
    } catch (error) {
      console.error("Error inserting parent connect messages: ", error);
    }
  }

  /**
   * Get the parent connect messages
   */
  async getParentConnectMessages(): Promise<any> {
    if (!this.isNative) return Promise.resolve([]);
    try {
      const response = await this.db.query('SELECT * FROM parent_connect');
      return Promise.resolve(response.values || []);
    } catch (error) {
      console.error(error);
      return Promise.reject("Some problem exist try again later");
    }
  }

  /**
   * truncate the table when user logged out
   */
  async deleteDataBase() {
    if (!this.isNative) return;
    try {
      await this.db.run('DELETE FROM classes');
      await this.db.run('DELETE FROM students');
      await this.db.run('DELETE FROM private_message');
      await this.db.run('DELETE FROM parent_connect');
      console.log("Local database tables cleared successfully");
    } catch (error) {
      console.error("Error clearing database: ", error);
    }
  }
}