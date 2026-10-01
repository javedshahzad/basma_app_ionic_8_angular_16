import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private readonly dbName = 'attendance.db';
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

  // The one in-flight open, shared by every caller. At cold start four things
  // ask for the database at the same moment (app.component, tabs.page twice,
  // and the refresh-token read via ensureReady). `this.db` is only assigned
  // after createConnection() resolves, so unshared callers all saw "no
  // connection yet" and each created one: the losers failed with
  // "Connection attendance already exists". That failure escaped the token
  // refresh, so every request that needed a refresh died with a status-less
  // error ("HTTP unknown (Unknown Error)" in Sentry).
  private openInFlight: Promise<any> | null = null;
  private readyInFlight: Promise<void> | null = null;

  /**
   * Open the local database. Safe to call from anywhere, any number of times:
   * concurrent and repeat calls share one open. A failed open is not cached,
   * so the next call tries again.
   */
  openDataBase(): Promise<any> {
    if (!this.openInFlight) {
      this.openInFlight = this.doOpenDataBase().catch(error => {
        this.openInFlight = null;
        throw error;
      });
    }
    return this.openInFlight;
  }

  /**
   * For startup paths that must carry on whether or not the local database
   * could be opened (routing, the signed-in menu, the user's name). The
   * database is a cache plus the credential store, so a failure to open it
   * must not stop the app booting or leave a signed-in user looking signed out.
   * Never rejects; resolves false (and logs) when the database isn't available.
   * Later credential reads/writes go through ensureReady(), which retries.
   */
  async tryOpenDataBase(): Promise<boolean> {
    try {
      await this.openDataBase();
      return true;
    } catch (error) {
      console.warn('Local database unavailable; continuing without it.', error);
      return false;
    }
  }

  private async doOpenDataBase(): Promise<any> {
    await this.platform.ready();
    if (!this.isNative) {
      return true; // تخطي في حالة المتصفح
    }

    try {
      if (await this.isHandleOpen()) {
        return true;
      }

      await this.ensureEncryptionSecret();

      // After live-reload or a new SQLiteConnection wrapper, the JS map is
      // empty while Android still holds "attendance". isConnection() then
      // returns false and createConnection() throws
      // "Connection attendance already exists". Sync the wrapper first.
      try {
        await this.sqlite.checkConnectionsConsistency();
      } catch {
        // Older / stub plugin — create-or-retrieve below still covers this.
      }

      const isConn = (await this.sqlite.isConnection(this.dbName, false)).result;
      if (isConn) {
        this.db = await this.sqlite.retrieveConnection(this.dbName, false);
      } else {
        await this.discardUnencryptedDatabase();
        // 'secret' opens the encrypted database with the stored passphrase and
        // creates it when it doesn't exist yet. NOT 'encryption': that mode
        // converts an existing PLAIN file to encrypted, and throws
        // "Failed in encryption .../attendanceSQLite.db not found" when there is
        // none. discardUnencryptedDatabase() has just removed any plain file,
        // so 'encryption' could never work here: on every fresh install the
        // database failed to open, nothing in it (the refresh token, remember-me,
        // the offline cache) could be saved, and the user was signed out as soon
        // as the in-memory access token lapsed (Sentry issue 150453613).
        this.db = await this.createOrRetrieveConnection(true, 'secret');
      }

      await this.ensureDbOpen();
      return true;
    } catch (error) {
      console.error('Error opening DB: ', error);
      // Reject with the real error: this used to reject with a bare `false`,
      // which is why the failure showed up in Sentry with no message at all.
      throw error;
    }
  }

  private async isHandleOpen(): Promise<boolean> {
    if (!this.db) {
      return false;
    }
    try {
      return !!(await this.db.isDBOpen())?.result;
    } catch {
      return false;
    }
  }

  private async ensureDbOpen(): Promise<void> {
    try {
      await this.db.open();
    } catch (error) {
      if (!this.messageIncludes(error, 'already exists') && !this.messageIncludes(error, 'already open')) {
        throw error;
      }
    }
  }

  /**
   * createConnection() talks to the native plugin, which still has the
   * connection after a JS-wrapper reset. Prefer the existing JS handle;
   * if the wrapper lost it, close the native leftover and create again.
   */
  private async createOrRetrieveConnection(encrypted: boolean, mode: string): Promise<SQLiteDBConnection> {
    try {
      return await this.sqlite.createConnection(this.dbName, encrypted, mode, 1, false);
    } catch (error) {
      if (!this.messageIncludes(error, 'already exists')) {
        throw error;
      }
      try {
        return await this.sqlite.retrieveConnection(this.dbName, false);
      } catch {
        try {
          await this.sqlite.closeConnection(this.dbName, false);
        } catch {
          // native leftover with no JS handle
        }
        return await this.sqlite.createConnection(this.dbName, encrypted, mode, 1, false);
      }
    }
  }

  private messageIncludes(error: unknown, snippet: string): boolean {
    const message =
      typeof error === 'string'
        ? error
        : error && typeof error === 'object' && 'message' in error
          ? String((error as { message: unknown }).message)
          : String(error ?? '');
    return message.toLowerCase().includes(snippet.toLowerCase());
  }

  /**
   * Generates a random passphrase and stores it once in the platform's secure
   * store (iOS Keychain / Android Keystore-backed prefs), which CapacitorSQLite
   * then uses to encrypt attendance.db. Safe to call on every launch since
   * isSecretStored() short-circuits after the first run.
   */
  private async ensureEncryptionSecret() {
    const stored = await this.sqlite.isSecretStored();
    if (!stored.result) {
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      const passphrase = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
      await this.sqlite.setEncryptionSecret(passphrase);
    }
  }

  /**
   * attendance.db is a pure cache (classes/students/messages/news) that gets
   * fully repopulated from the server after login, so upgrading an existing
   * unencrypted install just means discarding the old plaintext file rather
   * than converting it in place.
   */
  private async discardUnencryptedDatabase() {
    const exists = (await this.sqlite.isDatabase(this.dbName)).result;
    if (!exists) return;

    const encrypted = (await this.sqlite.isDatabaseEncrypted(this.dbName)).result;
    if (encrypted) return;

    const isConn = (await this.sqlite.isConnection(this.dbName, false)).result;
    if (isConn) {
      await this.sqlite.closeConnection(this.dbName, false);
    }

    try {
      const oldDb = await this.createOrRetrieveConnection(false, 'no-encryption');
      await oldDb.open();
      await oldDb.delete();
    } finally {
      try {
        await this.sqlite.closeConnection(this.dbName, false);
      } catch {
        // already closed or never opened
      }
    }
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
      // Password-bearing "remember me" / multi-account credentials — kept in
      // this same encrypted attendance.db rather than the plaintext
      // IonicStorage/localStorage used elsewhere. Unlike the cache tables
      // above, this one is NOT truncated by deleteDataBase() on logout.
      const credentialsTable = `CREATE TABLE IF NOT EXISTS credentials (
                                key VARCHAR(50) PRIMARY KEY, value TEXT
                              );`;
      // Per-class, per-date attendance sheet snapshot — lets a teacher/admin
      // review a previously-viewed date's marks while offline, not just
      // write new ones. `sheet` is the same {cem-1: 1, ...} shape the API
      // already returns per student, stored as JSON text (same convention
      // as `credentials.value`) rather than a wide column-per-period schema
      // since the number of periods varies by class.
      const attendanceHistoryTable = `CREATE TABLE IF NOT EXISTS attendance_history (
                                cid INT, sid INT, date VARCHAR(20), sheet TEXT,
                                PRIMARY KEY (cid, sid, date)
                              );`;

      // تنفيذ الجداول بالتسلسل
      await this.db.execute(classesTable);
      await this.db.execute(studentsTable);
      await this.db.execute(privateMsgTable);
      await this.db.execute(parentConnTable);
      await this.db.execute(newsTable);
      await this.db.execute(credentialsTable);
      await this.db.execute(attendanceHistoryTable);
      
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
  async getStudentList(cid: any): Promise<any> {
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

  async getStudent(sid: string | number): Promise<any> {
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
   * insert or update a class's attendance sheet snapshot for one date
   */
  async insertAttendanceHistory(cid: string | number, date: string, students: Array<any>) {
    if (!this.isNative) return;
    try {
      for (const student of students) {
        const query = `INSERT OR REPLACE INTO attendance_history (cid, sid, date, sheet) VALUES (?, ?, ?, ?)`;
        await this.db.run(query, [cid, student.sid, date, JSON.stringify(student.sheet || {})]);
      }
    } catch (error) {
      console.error("Error inserting attendance history: ", error);
    }
  }

  /**
   * Get the cached attendance sheets for a class on one date, keyed by sid
   */
  async getAttendanceHistory(cid: string | number, date: string): Promise<Record<string, any>> {
    if (!this.isNative) return {};
    try {
      const response = await this.db.query('SELECT sid, sheet FROM attendance_history WHERE cid = ? AND date = ?', [cid, date]);
      const rows = response.values || [];
      const bySid: Record<string, any> = {};
      for (const row of rows) {
        try {
          bySid[row.sid] = JSON.parse(row.sheet || '{}');
        } catch {
          bySid[row.sid] = {};
        }
      }
      return bySid;
    } catch (error) {
      console.error(error);
      return {};
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
      await this.db.run('DELETE FROM attendance_history');
      console.log("Local database tables cleared successfully");
    } catch (error) {
      console.error("Error clearing database: ", error);
    }
    // Deliberately NOT clearing `credentials` here — "remember me" and
    // multi-account switching both need to survive a logout.
  }

  /**
   * Opens the connection/creates tables on demand, in case a credential
   * method runs before app.component.ts's normal startup sequence has
   * done so (mirrors StorageService's own defensive lazy-init pattern).
   */
  private ensureReady(): Promise<void> {
    if (!this.readyInFlight) {
      this.readyInFlight = (async () => {
        await this.openDataBase();
        await this.createTable();
      })().catch(error => {
        this.readyInFlight = null;
        throw error;
      });
    }
    return this.readyInFlight;
  }

  /**
   * Store a password-bearing value (remember-me credentials, the
   * multi-account "earlyLogin" list) in the encrypted attendance.db.
   * No-ops on web, where CapacitorSQLite isn't available — callers should
   * fall back to CredentialStorageService's web path, not call this
   * directly.
   */
  async setCredential(key: string, value: unknown): Promise<void> {
    if (!this.isNative) return;
    await this.ensureReady();
    try {
      await this.db.run('INSERT OR REPLACE INTO credentials (key, value) VALUES (?, ?)', [key, JSON.stringify(value)]);
    } catch (error) {
      console.error('Error saving credential: ', error);
    }
  }

  async getCredential<T = any>(key: string): Promise<T | null> {
    if (!this.isNative) return null;
    await this.ensureReady();
    try {
      const response = await this.db.query('SELECT value FROM credentials WHERE key = ?', [key]);
      const row = response.values && response.values[0];
      return row ? JSON.parse(row.value) : null;
    } catch (error) {
      console.error('Error reading credential: ', error);
      return null;
    }
  }

  async removeCredential(key: string): Promise<void> {
    if (!this.isNative) return;
    await this.ensureReady();
    try {
      await this.db.run('DELETE FROM credentials WHERE key = ?', [key]);
    } catch (error) {
      console.error('Error removing credential: ', error);
    }
  }
}