import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { DatabaseService } from '../database/database.service';
import { StorageService } from '../storage.service';

/**
 * Storage for password-bearing data only (remember-me credentials, the
 * multi-account "earlyLogin" list) — NOT a general-purpose replacement for
 * StorageService. Routes to DatabaseService's encrypted CapacitorSQLite
 * database on native platforms (iOS/Android, where OS-backed encryption
 * is actually available), falling back to the existing StorageService
 * (IndexedDB/localStorage, unencrypted) on web, where no stronger option
 * exists in a browser context.
 *
 * Interim mitigation (2026-08-24): the real fix is a backend-issued
 * session/refresh token so the raw password never needs to persist at
 * all — blocked on backend work that hasn't started (the new Node.js
 * API's `login` response has no token field; `viewUser`'s own spec
 * description says JWT support is a future migration path, not present
 * in v1). This narrows the exposure on native builds without waiting on
 * that, and does not depend on it landing first.
 *
 * `get()` also performs a one-time migration: existing installs already
 * have plaintext copies sitting in StorageService/raw localStorage from
 * before this fix. The first read after upgrading finds that old value,
 * copies it into the new (encrypted, on native) location, and deletes the
 * plaintext copies — so upgrading actually removes the exposure for
 * existing users, not just new writes going forward.
 */
@Injectable({
  providedIn: 'root'
})
export class CredentialStorageService {
  private isNative = Capacitor.isNativePlatform();

  constructor(
    private db: DatabaseService,
    private storage: StorageService
  ) {}

  async set(key: string, value: unknown): Promise<void> {
    if (this.isNative) {
      await this.db.setCredential(key, value);
    } else {
      await this.storage.set(key, value);
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    const current = this.isNative ? await this.db.getCredential<T>(key) : await this.storage.get(key);
    if (current) {
      return current;
    }
    return this.migrateLegacyValue<T>(key);
  }

  async remove(key: string): Promise<void> {
    if (this.isNative) {
      await this.db.removeCredential(key);
    } else {
      await this.storage.remove(key);
    }
    // Also clear any pre-migration plaintext copy, on either platform.
    await this.storage.remove(key);
    try {
      localStorage.removeItem(key);
    } catch {
      // Not available (SSR/native webview edge cases) — nothing to clear.
    }
  }

  private async migrateLegacyValue<T>(key: string): Promise<T | null> {
    // On native, StorageService is a stale location (pre-encryption data,
    // or data from a build that ran on web before) — check it. On web,
    // StorageService IS the canonical location, and get() already
    // confirmed it's empty there, so there's nothing further to check.
    let legacy: T | null = null;
    let foundInStorage = false;
    if (this.isNative) {
      legacy = await this.storage.get(key);
      foundInStorage = !!legacy;
    }

    if (!legacy) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          legacy = JSON.parse(raw);
        }
      } catch {
        // Not available, or not valid JSON — nothing to migrate from here.
      }
    }

    if (!legacy) {
      return null;
    }

    if (this.isNative) {
      // Move into the new encrypted location; only clear StorageService if
      // that's actually where this copy came from (never write-then-erase
      // the same key on the same store).
      await this.db.setCredential(key, legacy);
      if (foundInStorage) {
        await this.storage.remove(key);
      }
    } else {
      // Web has no stronger store to move into — StorageService itself
      // IS the fix, just for the value that used to bypass it via raw
      // localStorage.
      await this.storage.set(key, legacy);
    }
    try {
      localStorage.removeItem(key);
    } catch {
      // Nothing to clear.
    }

    return legacy;
  }
}
