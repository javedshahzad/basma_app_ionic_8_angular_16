import { httpFailureLevel, reportHttpFailure } from './http-failure-report';

describe('http failure reporting', () => {
  describe('httpFailureLevel', () => {
    it('treats an unanswered request (offline, dropped connection) as a warning', () => {
      expect(httpFailureLevel({ status: 0 })).toBe('warning');
      expect(httpFailureLevel({ message: 'Timeout has occurred' })).toBe('warning');
      expect(httpFailureLevel(undefined)).toBe('warning');
    });

    it('treats the client-side timeout as a warning', () => {
      expect(httpFailureLevel({ name: 'TimeoutError', message: 'x' })).toBe('warning');
      expect(httpFailureLevel({ status: 'unknown', message: 'Timeout has occurred' })).toBe('warning');
    });

    it('treats a 401 (session ended, user signed out) as a warning', () => {
      expect(httpFailureLevel({ status: 401 })).toBe('warning');
    });

    it('keeps real server and client failures as errors', () => {
      for (const status of [400, 403, 404, 500, 502, 503]) {
        expect(httpFailureLevel({ status })).toBe('error');
      }
    });
  });

  describe('reportHttpFailure', () => {
    const run = (error: unknown, slug: string) => {
      const captureException = jasmine.createSpy('captureException');
      reportHttpFailure(error, slug, (() => Promise.resolve({ captureException })) as never);
      return captureException;
    };

    it('wraps the failure in an Error with the level and only safe extra fields', async () => {
      const capture = run({ status: 500, statusText: 'Server Error', error: { msg: 'private body' }, url: 'https://x/?u=1' }, 'getCourses/1');
      await Promise.resolve();
      const [wrapped, hint] = capture.calls.mostRecent().args;
      expect(wrapped.message).toBe('HTTP 500 (Server Error) on getCourses/1');
      expect(hint.level).toBe('error');
      expect(hint.extra).toEqual({ slug: 'getCourses/1', status: 500, statusText: 'Server Error' });
    });

    it('reports an offline failure as a warning', async () => {
      const capture = run({ status: 0, statusText: 'Unknown Error' }, 'getStudents/1');
      await Promise.resolve();
      expect(capture.calls.mostRecent().args[1].level).toBe('warning');
    });

    it('does nothing when Sentry is not loaded', () => {
      expect(() => reportHttpFailure({ status: 500 }, 'x', () => undefined as never)).not.toThrow();
    });
  });
});
