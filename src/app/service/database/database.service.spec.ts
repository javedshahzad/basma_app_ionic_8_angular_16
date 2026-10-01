import { TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { AppRate } from '@awesome-cordova-plugins/app-rate/ngx';
import { Storage as IonicStorage } from '@ionic/storage-angular';
import { of, NEVER } from 'rxjs';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';

import { DatabaseService } from './database.service';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

describe('DatabaseService', () => {
  let service: DatabaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), TranslateModule.forRoot(), RouterTestingModule],
      providers: [
        { provide: AppRate, useValue: {} },
        {
          provide: IonicStorage,
          useValue: {
            create: () =>
              Promise.resolve({
                get: () => Promise.resolve(null),
                set: () => Promise.resolve(),
                remove: () => Promise.resolve(),
                clear: () => Promise.resolve()
              })
          }
        },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(DatabaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('opening the native database', () => {
    // Stands in for @capacitor-community/sqlite. createConnection takes a few
    // ms, which is the window in which concurrent callers used to slip
    // through, and (like the real plugin) throws if a connection for the same
    // database already exists.
    function useFakeNativeSqlite(opts: { failFirstCreate?: boolean; leftoverNative?: boolean } = {}) {
      const calls = { create: 0, retrieve: 0, modes: [] as string[] };
      let connected = false;
      let nativeHasConnection = !!opts.leftoverNative;
      let db: any = opts.leftoverNative
        ? {
            open: () => Promise.resolve(),
            isDBOpen: async () => ({ result: true }),
            execute: () => Promise.resolve(),
            run: () => Promise.resolve(),
            query: () => Promise.resolve({ values: [{ value: JSON.stringify('refresh-token-1') }] })
          }
        : undefined;
      // Like the real plugin on a fresh install: there is no database file, so
      // opening in 'encryption' mode (convert an existing PLAIN file to
      // encrypted) fails at open(), while 'secret' creates the encrypted file.
      const makeDb = (mode: string) => ({
        open: () =>
          mode === 'encryption'
            ? Promise.reject({ message: 'Open: Failed in encryption /data/user/0/app/databases/attendanceSQLite.db not found' })
            : Promise.resolve(),
        isDBOpen: async () => ({ result: true }),
        execute: () => Promise.resolve(),
        run: () => Promise.resolve(),
        query: () => Promise.resolve({ values: [{ value: JSON.stringify('refresh-token-1') }] })
      });
      const sqlite = {
        isSecretStored: async () => ({ result: true }),
        checkConnectionsConsistency: async () => ({ result: connected === nativeHasConnection }),
        isConnection: async () => ({ result: connected }),
        isDatabase: async () => ({ result: false }),
        closeConnection: async () => {
          connected = false;
          nativeHasConnection = false;
        },
        retrieveConnection: async () => {
          calls.retrieve++;
          // The real plugin only returns a handle the JS wrapper already
          // tracks. After live-reload the wrapper is empty, so this throws
          // even though Android still has the connection.
          if (!connected || !db) {
            throw { message: 'Connection attendance does not exist' };
          }
          return db;
        },
        createConnection: async (_name: string, _encrypted: boolean, mode: string) => {
          calls.create++;
          calls.modes.push(mode);
          await new Promise(resolve => setTimeout(resolve, 5));
          if (connected || nativeHasConnection) throw { message: 'CreateConnection: Connection attendance already exists' };
          if (opts.failFirstCreate && calls.create === 1) throw new Error('disk error');
          connected = true;
          nativeHasConnection = true;
          db = makeDb(mode);
          return db;
        }
      };
      const internals = service as any;
      internals.isNative = true;
      internals.sqlite = sqlite;
      service.platform = { ready: () => Promise.resolve() } as any;
      return calls;
    }

    it('creates one connection when several callers open it at once (cold start)', async () => {
      const calls = useFakeNativeSqlite();

      // app.component, tabs.page (twice) and the refresh-token read all do
      // this within the same few milliseconds at launch.
      const [, , , token] = await Promise.all([
        service.openDataBase(),
        service.openDataBase(),
        service.openDataBase(),
        service.getCredential<string>('refreshToken')
      ]);

      expect(calls.create).toBe(1);
      expect(token).toBe('refresh-token-1');
    });

    it('creates the encrypted database in "secret" mode, so a fresh install can open it', async () => {
      // Sentry issue 150453613: mode "encryption" threw "Failed in encryption
      // ...attendanceSQLite.db not found" on every fresh install.
      const calls = useFakeNativeSqlite();

      await expectAsync(service.openDataBase()).toBeResolved();
      expect(calls.modes).toEqual(['secret']);
    });

    it('tryOpenDataBase never rejects, so app boot carries on when the database is unavailable', async () => {
      // Sentry issue 150081149: the open rejected with a bare `false`, unhandled
      // at the tabs page ("Handled unknown error"), and app.component's whole
      // startup sequence sat inside the .then of that open, so it never ran.
      useFakeNativeSqlite({ failFirstCreate: true });

      await expectAsync(service.tryOpenDataBase()).toBeResolvedTo(false);
      await expectAsync(service.tryOpenDataBase()).toBeResolvedTo(true); // retried, now available
    });

    it('rejects with the real error, not a bare false, and tries again on the next call', async () => {
      const calls = useFakeNativeSqlite({ failFirstCreate: true });

      await expectAsync(service.openDataBase()).toBeRejectedWithError('disk error');
      await expectAsync(service.openDataBase()).toBeResolved();
      expect(calls.create).toBe(2);
    });

    it('closes a leftover native connection and opens again instead of failing with already exists', async () => {
      // Live-reload / a new SQLiteConnection wrapper: JS isConnection() is
      // false, but Android still has "attendance". createConnection then
      // throws and used to take the whole open down with it.
      const calls = useFakeNativeSqlite({ leftoverNative: true });

      await expectAsync(service.openDataBase()).toBeResolved();
      expect(calls.create).toBe(2);
      expect(calls.retrieve).toBe(1);
      await expectAsync(service.getCredential<string>('refreshToken')).toBeResolvedTo('refresh-token-1');
    });
  });
});
