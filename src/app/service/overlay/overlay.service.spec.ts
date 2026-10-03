import { TestBed } from '@angular/core/testing';
import { AlertController, PopoverController, ToastController } from '@ionic/angular';

import { GENERIC_ERROR_MESSAGE, messageFromError, OverlayService } from './overlay.service';

describe('OverlayService error text', () => {
  describe('messageFromError', () => {
    it('keeps a string as it is', () => {
      expect(messageFromError('Wrong password')).toBe('Wrong password');
    });

    it('reads the message of an Error or a Capacitor plugin error', () => {
      expect(messageFromError(new Error('boom'))).toBe('boom');
      expect(messageFromError({ code: 'UNIMPLEMENTED', message: '"Device" plugin is not implemented on ios' })).toBe(
        '"Device" plugin is not implemented on ios'
      );
    });

    it('prefers the server message inside an HttpErrorResponse over its generic transport text', () => {
      const httpError = { message: 'Http failure response for https://x/api: 401 Unauthorized', error: { msg: 'Invalid credentials' } };
      expect(messageFromError(httpError)).toBe('Invalid credentials');
      expect(messageFromError({ message: 'Http failure', error: 'Plain body' })).toBe('Plain body');
    });

    it('returns an empty string for values with nothing readable', () => {
      for (const value of [undefined, null, false, 0, 42, {}, [], { message: '   ' }, { error: {} }]) {
        expect(messageFromError(value)).toBe('');
      }
    });
  });

  describe('alerts', () => {
    let service: OverlayService;
    let create: jasmine.Spy;

    beforeEach(() => {
      create = jasmine.createSpy('create').and.resolveTo({ present: () => Promise.resolve() });
      TestBed.configureTestingModule({
        providers: [
          { provide: PopoverController, useValue: {} },
          { provide: AlertController, useValue: { create } },
          { provide: ToastController, useValue: {} }
        ]
      });
      service = TestBed.inject(OverlayService);
    });

    it('removeUrlFromString does not throw on non-string input (Sentry 151065986)', () => {
      // The exact failure: I.replace is not a function, when a catch block handed over an object.
      expect(() => service.removeUrlFromString({ code: 'UNIMPLEMENTED' })).not.toThrow();
      expect(service.removeUrlFromString(undefined)).toBe('');
      expect(service.removeUrlFromString({ message: 'See https://example.com/help for details' })).toBe('See  for details');
    });

    it('errorAlert shows the real message of an error object', async () => {
      await service.errorAlert({ message: 'Device plugin missing' });
      expect(create.calls.mostRecent().args[0].message).toBe('Device plugin missing');
    });

    it('errorAlert falls back to a generic message instead of an empty alert', async () => {
      await service.errorAlert({});
      expect(create.calls.mostRecent().args[0].message).toBe(GENERIC_ERROR_MESSAGE);
      await service.errorAlert(undefined);
      expect(create.calls.mostRecent().args[0].message).toBe(GENERIC_ERROR_MESSAGE);
    });
  });
});
