import { HttpHandler, HttpParams, HttpRequest, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';

import { MyInterceptor } from './MyInterceptor';

describe('MyInterceptor', () => {
  let interceptor: MyInterceptor;
  let authStub: { currentUser: any; currentUuid: string | null };
  let handledRequest: HttpRequest<any>;
  let handler: HttpHandler;

  beforeEach(() => {
    authStub = { currentUser: { details: { user_no: '123' } }, currentUuid: 'test-uuid' };

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
});
