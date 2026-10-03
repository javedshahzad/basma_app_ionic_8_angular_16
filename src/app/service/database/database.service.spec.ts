import { TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
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
    //
    // Like the real plugin it has TWO places that know about connections: the
    // JavaScript side's map (what isConnection answers from, empty on every page
    // load) and the native side (kept for the life of the process, what
    // createConnection checks). staleNativeConnection starts them out of step,
    // as after a WebView restart with the process still alive.
    function useFakeNativeSqlite(
      opts: { failFirstCreate?: boolean; staleNativeConnection?: boolean; alwaysFail?: boolean } = {}
    ) {
      const calls = { create: 0, consistency: 0, modes: [] as string[] };
      let jsKnows = false;
      let nativeHas = !!opts.staleNativeConnection;
      let db: any;
      // Like the real plugin on a fresh install: there is no database file, so
      // opening in 'encryption' mode (convert an existing PLAIN file to
      // encrypted) fails at open(), while 'secret' creates the encrypted file.
      const makeDb = (mode: string) => ({
        open: () =>
          mode === 'encryption'
            ? Promise.reject({ message: 'Open: Failed in encryption /data/user/0/app/databases/attendanceSQLite.db not found' })
            : Promise.resolve(),
        execute: () => Promise.resolve(),
        run: () => Promise.resolve(),
        query: () => Promise.resolve({ values: [{ value: JSON.stringify('refresh-token-1') }] })
      });
      const sqlite = {
        isSecretStored: async () => ({ result: true }),
        isConnection: async () => ({ result: jsKnows }),
        // The plugin's own repair: with nothing known to the JavaScript side it closes
        // whatever the native side is still holding.
        checkConnectionsConsistency: async () => {
          calls.consistency++;
          if (!jsKnows) nativeHas = false;
          return { result: jsKnows === nativeHas };
        },
        isDatabase: async () => ({ result: false }),
        retrieveConnection: async () => db,
        createConnection: async (_name: string, _encrypted: boolean, mode: string) => {
          calls.create++;
          calls.modes.push(mode);
          await new Promise(resolve => setTimeout(resolve, 5));
          if (nativeHas) throw { message: 'CreateConnection: Connection attendance already exists' };
          if (opts.alwaysFail) throw new Error('disk error');
          if (opts.failFirstCreate && calls.create === 1) throw new Error('disk error');
          nativeHas = true;
          jsKnows = true;
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

    it('opens after the WebView restarted while the native layer kept its connection', async () => {
      // Sentry issue 150599335, on a build that already had the concurrent-open fix:
      // a fresh page knows no connections, the native side still has "attendance",
      // so createConnection failed with "Connection attendance already exists".
      const calls = useFakeNativeSqlite({ staleNativeConnection: true });

      await expectAsync(service.openDataBase()).toBeResolved();
      expect(calls.consistency).toBeGreaterThan(0);
      expect(calls.create).toBe(1);
    });

    describe('when the database cannot be opened at all', () => {
      beforeEach(() => useFakeNativeSqlite({ alwaysFail: true }));

      it('saving and removing a credential do not fail the caller', async () => {
        // A login the server already accepted must not look failed, and a logout
        // must not stop half-way, just because the local store is unavailable.
        await expectAsync(service.setCredential('refreshToken', 'x')).toBeResolved();
        await expectAsync(service.removeCredential('refreshToken')).toBeResolved();
      });

      it('reading a credential still rejects, so "can\'t read" is never mistaken for "no token"', async () => {
        await expectAsync(service.getCredential('refreshToken')).toBeRejected();
      });
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
  });
});
