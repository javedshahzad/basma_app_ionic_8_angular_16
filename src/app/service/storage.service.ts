import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private _storage: Storage | null = null; // 🌟 متغير خاص لحفظ نسخة المخزن الجاهزة

  constructor(private storage: Storage) {
    this.init();
  }

  async init() {
    // تهيئة المخزن وتخزينه في المتغير الخاص
    const storage = await this.storage.create();
    this._storage = storage;
  }

  // دالة مساعدة للتأكد من جاهزية المخزن قبل استخدامه
  private async ensureStorage() {
    if (!this._storage) {
      await this.init();
    }
    return this._storage;
  }

  async set(key: string, value: any) {
    const store = await this.ensureStorage(); // الانتظار حتى الجاهزية
    return await store?.set(key, value);
  }

  async get(key: string) {
    const store = await this.ensureStorage();
    return await store?.get(key);
  }

  // ملاحظة: مكتبة Ionic Storage تقوم بعمل JSON.parse و stringify تلقائياً
  // لذا يمكنك تبسيط الدالة هكذا:
  async setObject(key: string, value: any) {
    const store = await this.ensureStorage();
    return await store?.set(key, value);
  }

  async getObject(key: string) {
    const store = await this.ensureStorage();
    return await store?.get(key);
  }

  async remove(key: string) {
    const store = await this.ensureStorage();
    await store?.remove(key);
  }

  async clear() {
    const store = await this.ensureStorage();
    await store?.clear();
  }
}