import { TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { Storage as IonicStorage } from '@ionic/storage-angular';
import { of, NEVER } from 'rxjs';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { RouterTestingModule } from '@angular/router/testing';

import { AuthService } from './auth.service';
import { provideHttpClient, withInterceptorsFromDi, withXhr } from '@angular/common/http';

describe('AuthService', () => {
  let service: AuthService;

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
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('ensureAccessToken', () => {
    it('returns the token straight away when there already is one', async () => {
      service.accessToken = 'have-it';
      expect(await service.ensureAccessToken()).toBe('have-it');
    });

    it('resolves null without waiting when nobody is signed in', async () => {
      const started = Date.now();
      expect(await service.ensureAccessToken()).toBeNull();
      expect(Date.now() - started).toBeLessThan(1000);
    });

    it('waits for the startup refresh and returns the token it produced', async () => {
      let finishStartup: () => void = () => {};
      (service as any).startup = new Promise<void>(resolve => (finishStartup = resolve));

      const pending = service.ensureAccessToken();
      let settled = false;
      pending.then(() => (settled = true));
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(settled).toBeFalse();

      service.accessToken = 'from-startup-refresh';
      finishStartup();
      expect(await pending).toBe('from-startup-refresh');
    });

    it('gives up after the time limit instead of holding requests forever', async () => {
      (service as any).startup = new Promise<void>(() => {}); // never settles
      expect(await service.ensureAccessToken(30)).toBeNull();
    });
  });
});
