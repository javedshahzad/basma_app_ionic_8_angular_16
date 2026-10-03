import { TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Storage as IonicStorage } from '@ionic/storage-angular';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';

import { CredentialStorageService } from './credential-storage.service';

/**
 * Karma/Chrome always reports Capacitor.isNativePlatform() === false, so
 * these tests only exercise the web (StorageService) path — same
 * constraint DatabaseService's own spec already accepts, since the native
 * CapacitorSQLite path can't run in this harness. The web path is also
 * where the one-time plaintext migration matters most: any pre-fix
 * install running in a browser/webview only ever had raw localStorage,
 * never encrypted storage, so this is the path that actually cleans up
 * existing exposure.
 */
describe('CredentialStorageService', () => {
  let service: CredentialStorageService;
  let store: Record<string, unknown>;

  beforeEach(() => {
    store = {};
    localStorage.clear();

    TestBed.configureTestingModule({
      imports: [IonicModule.forRoot(), TranslateModule.forRoot(), RouterTestingModule],
      providers: [
        {
          provide: IonicStorage,
          useValue: {
            create: () =>
              Promise.resolve({
                get: (key: string) => Promise.resolve(store[key] ?? null),
                set: (key: string, value: unknown) => {
                  store[key] = value;
                  return Promise.resolve();
                },
                remove: (key: string) => {
                  delete store[key];
                  return Promise.resolve();
                },
                clear: () => {
                  store = {};
                  return Promise.resolve();
                }
              })
          }
        },
        provideHttpClient(withXhr(), withInterceptorsFromDi()),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(CredentialStorageService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('when the native encrypted store cannot be opened', () => {
    beforeEach(() => {
      // Pretend to be on a device (the harness itself is never native) and make
      // every read of the encrypted database fail.
      (service as any).isNative = true;
      spyOn((service as any).db, 'getCredential').and.rejectWith(new Error('database attendance not opened'));
    });

    it('get() rejects, so an unreadable refresh token is not mistaken for "not saved"', async () => {
      await expectAsync(service.get('refreshToken')).toBeRejected();
    });

    it('tryGet() treats it as nothing saved instead of failing the screen that asked', async () => {
      // login.page reads remember-me / the account list on ionViewWillEnter with
      // nothing to catch a rejection (Sentry issue 150599335, "Handled: No").
      await expectAsync(service.tryGet('usercredentials')).toBeResolvedTo(null);
    });
  });

  it('round-trips a value through set/get/remove', async () => {
    const value = { email_id: 'a@b.com', password: 'secret123', rememberMe: true };
    await service.set('usercredentials', value);

    expect(await service.get('usercredentials')).toEqual(value);

    await service.remove('usercredentials');
    expect(await service.get('usercredentials')).toBeNull();
  });

  it('returns null when nothing is stored anywhere', async () => {
    expect(await service.get('earlyLogin')).toBeNull();
  });

  it('migrates a pre-existing raw localStorage value and clears the plaintext copy', async () => {
    const legacy = [{ email_id: 'old@b.com', password: 'oldpass', user_no: 1 }];
    localStorage.setItem('earlyLogin', JSON.stringify(legacy));

    const result = await service.get('earlyLogin');

    expect(result).toEqual(legacy);
    // The plaintext copy must be gone after migration, not just duplicated.
    expect(localStorage.getItem('earlyLogin')).toBeNull();
    // And it should now be readable from the normal (non-migration) path too.
    expect(await service.get('earlyLogin')).toEqual(legacy);
  });

  it('remove() also clears a pre-existing raw localStorage copy, not just the new location', async () => {
    localStorage.setItem('usercredentials', JSON.stringify({ email_id: 'x@y.com', password: 'p' }));

    await service.remove('usercredentials');

    expect(localStorage.getItem('usercredentials')).toBeNull();
    expect(await service.get('usercredentials')).toBeNull();
  });
});
