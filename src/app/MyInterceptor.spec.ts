import { HttpErrorResponse, HttpHandler, HttpParams, HttpRequest, HttpResponse } from '@angular/common/http';
import { of, throwError } from 'rxjs';

import { MyInterceptor } from './MyInterceptor';

describe('MyInterceptor', () => {
  let interceptor: MyInterceptor;
  let authStub: { currentUser: any; currentUuid: string | null; accessToken: string | null; ensureAccessToken: jasmine.Spy };
  let handledRequest: HttpRequest<any>;
  let handler: HttpHandler;

  beforeEach(() => {
    authStub = {
      currentUser: { details: { user_no: '123' } },
      currentUuid: 'test-uuid',
      accessToken: null,
      ensureAccessToken: jasmine.createSpy('ensureAccessToken').and.resolveTo(null)
    };

    const alertControllerStub = { create: () => Promise.resolve({ present: () => Promise.resolve() }) } as any;
    const dataProviderStub = { hideLoading: () => {}, showToast: () => {} } as any;
    const routerStub = { navigate: () => Promise.resolve(true) } as any;
    const translateStub = { instant: (key: string) => key } as any;

    handler = {
      handle: (req: HttpRequest<any>) => {
        handledRequest = req;
        return of(new HttpResponse({ status: 200, body: {} }));
      }
    };

    interceptor = new MyInterceptor(alertControllerStub, dataProviderStub, authStub as any, routerStub, translateStub);
  });

  function makeRequest(body: any): HttpRequest<any> {
    return new HttpRequest('POST', 'https://staging.basmapp.com/api/v1/getAllRules', body);
  }

  it('moves uuid/user_no into the HttpParams body instead of the URL query string', done => {
    const body = new HttpParams().set('school_id', '1');
    interceptor.intercept(makeRequest(body), handler).subscribe(() => {
      expect(handledRequest.params.has('uuid')).toBeFalse();
      expect(handledRequest.params.has('user_no')).toBeFalse();
      expect((handledRequest.body as HttpParams).get('uuid')).toBe('test-uuid');
      expect((handledRequest.body as HttpParams).get('user_no')).toBe('123');
      expect((handledRequest.body as HttpParams).get('school_id')).toBe('1');
      done();
    });
  });

  it('sets uuid/user_no on a FormData body (file uploads) instead of the URL query string', done => {
    const body = new FormData();
    body.set('file', new Blob(['x']), 'x.png');
    interceptor.intercept(makeRequest(body), handler).subscribe(() => {
      expect(handledRequest.params.has('uuid')).toBeFalse();
      expect(handledRequest.params.has('user_no')).toBeFalse();
      expect((handledRequest.body as FormData).get('uuid')).toBe('test-uuid');
      expect((handledRequest.body as FormData).get('user_no')).toBe('123');
      done();
    });
  });

  it('does not add uuid/user_no to login/logout/schoolRegister requests', done => {
    const body = new HttpParams().set('email_id', 'a@b.com');
    const req = new HttpRequest('POST', 'https://staging.basmapp.com/api/v1/login', body);
    interceptor.intercept(req, handler).subscribe(() => {
      expect((handledRequest.body as HttpParams).has('uuid')).toBeFalse();
      expect((handledRequest.body as HttpParams).has('user_no')).toBeFalse();
      expect(handledRequest.params.has('uuid')).toBeFalse();
      done();
    });
  });

  it('leaves the request untouched when nobody is logged in', done => {
    authStub.currentUser = null;
    const body = new HttpParams().set('school_id', '1');
    interceptor.intercept(makeRequest(body), handler).subscribe(() => {
      expect((handledRequest.body as HttpParams).has('uuid')).toBeFalse();
      expect(handledRequest.params.has('uuid')).toBeFalse();
      done();
    });
  });

  describe('at a cold start, before the access token exists', () => {
    it('waits for the startup token and sends the request once, with it', async () => {
      let release: () => void = () => {};
      authStub.ensureAccessToken.and.callFake(
        () =>
          new Promise<string>(resolve => {
            release = () => {
              authStub.accessToken = 'startup-token';
              resolve('startup-token');
            };
          })
      );
      let sent = 0;
      handler = {
        handle: (req: HttpRequest<any>) => {
          sent++;
          handledRequest = req;
          return of(new HttpResponse({ status: 200, body: {} }));
        }
      };

      const done = new Promise<void>(resolve => interceptor.intercept(makeRequest(new HttpParams()), handler).subscribe(() => resolve()));
      await new Promise(resolve => setTimeout(resolve, 20));
      expect(sent).toBe(0); // held back, not sent tokenless to get a 401

      release();
      await done;
      expect(sent).toBe(1);
      expect(handledRequest.headers.get('Authorization')).toBe('Bearer startup-token');
    });

    it('does not wait when a token is already there', done => {
      authStub.accessToken = 'have-it';
      interceptor.intercept(makeRequest(new HttpParams()), handler).subscribe(() => {
        expect(authStub.ensureAccessToken).not.toHaveBeenCalled();
        expect(handledRequest.headers.get('Authorization')).toBe('Bearer have-it');
        done();
      });
    });

    it('does not wait for login or refreshToken, which have to work without a token', done => {
      const login = new HttpRequest('POST', 'https://staging.basmapp.com/api/v1/login', new HttpParams());
      interceptor.intercept(login, handler).subscribe(() => {
        const refresh = new HttpRequest('POST', 'https://staging.basmapp.com/api/v1/refreshToken', new HttpParams());
        interceptor.intercept(refresh, handler).subscribe(() => {
          expect(authStub.ensureAccessToken).not.toHaveBeenCalled();
          done();
        });
      });
    });

    it('still sends the request if the token never arrives', done => {
      authStub.ensureAccessToken.and.resolveTo(null);
      interceptor.intercept(makeRequest(new HttpParams()), handler).subscribe(() => {
        expect(handledRequest.headers.has('Authorization')).toBeFalse();
        done();
      });
    });
  });

  describe('requests to hosts other than our API', () => {
    const thirdParty = () => new HttpRequest('GET', 'https://ipinfo.io?token=abc');

    it('never get the user token, and never wait for one', done => {
      authStub.accessToken = 'secret-user-token';
      interceptor.intercept(thirdParty(), handler).subscribe(() => {
        expect(handledRequest.headers.has('Authorization')).toBeFalse();
        expect(authStub.ensureAccessToken).not.toHaveBeenCalled();
        done();
      });
    });

    it('do not get uuid/user_no added to a POST body', done => {
      const req = new HttpRequest('POST', 'https://example.com/hook', new HttpParams().set('a', '1'));
      interceptor.intercept(req, handler).subscribe(() => {
        expect((handledRequest.body as HttpParams).has('uuid')).toBeFalse();
        expect((handledRequest.body as HttpParams).has('user_no')).toBeFalse();
        done();
      });
    });

    it('a 401 from them does not trigger a token refresh or a sign-out', done => {
      const refreshAccessToken = jasmine.createSpy('refreshAccessToken');
      const flushLocalStorage = jasmine.createSpy('flushLocalStorage');
      const unauthorized = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
      const failing: HttpHandler = { handle: () => throwError(() => unauthorized) };
      const auth: any = { currentUser: null, accessToken: 'tok', ensureAccessToken: () => Promise.resolve('tok'), refreshAccessToken, flushLocalStorage };
      const icp = new MyInterceptor({} as any, { hideLoading: () => {}, showToast: () => {} } as any, auth, { navigate: () => Promise.resolve(true) } as any, { instant: (k: string) => k } as any);
      icp.intercept(thirdParty(), failing).subscribe({
        error: err => {
          expect(err).toBe(unauthorized);
          expect(refreshAccessToken).not.toHaveBeenCalled();
          expect(flushLocalStorage).not.toHaveBeenCalled();
          done();
        }
      });
    });
  });

  describe('when the access token is rejected (401)', () => {
    let navigate: jasmine.Spy;
    let flushLocalStorage: jasmine.Spy;
    let refreshAccessToken: jasmine.Spy;
    let sent: HttpRequest<any>[];
    let unauthorized: HttpErrorResponse;
    let rejectingHandler: HttpHandler;
    let auth: any;

    beforeEach(() => {
      navigate = jasmine.createSpy('navigate').and.resolveTo(true);
      flushLocalStorage = jasmine.createSpy('flushLocalStorage').and.resolveTo();
      refreshAccessToken = jasmine.createSpy('refreshAccessToken');
      auth = {
        currentUser: { details: { user_no: '123' } },
        currentUuid: 'test-uuid',
        accessToken: 'stale-token',
        refreshAccessToken,
        flushLocalStorage
      };
      sent = [];
      unauthorized = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
      // First attempt is rejected; a retry with a fresh token succeeds.
      rejectingHandler = {
        handle: (req: HttpRequest<any>) => {
          sent.push(req);
          return sent.length === 1 ? throwError(() => unauthorized) : of(new HttpResponse({ status: 200, body: {} }));
        }
      };
      interceptor = new MyInterceptor(
        { create: () => Promise.resolve({ present: () => Promise.resolve() }) } as any,
        { hideLoading: () => {}, showToast: () => {} } as any,
        auth,
        { navigate } as any,
        { instant: (key: string) => key } as any
      );
    });

    const request = () => makeRequest(new HttpParams().set('school_id', '1'));

    it('retries once with the refreshed token', done => {
      refreshAccessToken.and.resolveTo('fresh-token');
      interceptor.intercept(request(), rejectingHandler).subscribe(() => {
        expect(sent.length).toBe(2);
        expect(sent[1].headers.get('Authorization')).toBe('Bearer fresh-token');
        expect(navigate).not.toHaveBeenCalled();
        done();
      });
    });

    it('signs the user out when the server rejects the refresh token (refresh resolves null)', done => {
      refreshAccessToken.and.resolveTo(null);
      interceptor.intercept(request(), rejectingHandler).subscribe({
        error: err => {
          expect(err).toBe(unauthorized);
          expect(flushLocalStorage).toHaveBeenCalled();
          done();
        }
      });
    });

    it('surfaces the original 401, and keeps the user signed in, when the refresh attempt itself throws', done => {
      // e.g. the local credential store could not be opened. This used to
      // escape as a status-less error ("HTTP unknown (Unknown Error)").
      refreshAccessToken.and.rejectWith(false);
      interceptor.intercept(request(), rejectingHandler).subscribe({
        error: err => {
          expect(err).toBe(unauthorized);
          expect(err.status).toBe(401);
          expect(sent.length).toBe(1);
          expect(flushLocalStorage).not.toHaveBeenCalled();
          expect(navigate).not.toHaveBeenCalled();
          done();
        }
      });
    });
  });
});
