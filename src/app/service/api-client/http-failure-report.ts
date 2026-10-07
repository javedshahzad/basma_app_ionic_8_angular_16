import { loadSentryAngular } from '../sentry/sentry-lazy';

export type HttpFailureLevel = 'warning' | 'error';

/**
 * How loudly a failed API call should be reported.
 *
 * Three kinds of failure say nothing about a bug in the app, so they are warnings:
 *  - HTTP 0 / unknown status: the request never got an answer (offline, dropped
 *    connection, iOS suspending the web view on resume).
 *  - The client-side timeout.
 *  - 401: the session ended and the interceptor signs the user out.
 * Warnings stay visible in Sentry but stop burying real errors, since one dropped
 * connection otherwise produces a Sentry issue per request in flight.
 */
export function httpFailureLevel(error: unknown): HttpFailureLevel {
  const { status, name, message } = (error ?? {}) as { status?: unknown; name?: unknown; message?: unknown };
  if (status === 0 || status === undefined || status === null || status === 'unknown' || status === 401) {
    return 'warning';
  }
  if (name === 'TimeoutError' || (typeof message === 'string' && /timeout has occurred/i.test(message))) {
    return 'warning';
  }
  return 'error';
}

/**
 * Sends a failed API call to Sentry. HttpErrorResponse doesn't extend Error, so it
 * is wrapped in a real Error to get a readable title that groups by endpoint and
 * status. The raw response is deliberately not forwarded: `error.error` is the
 * backend's body, which can echo submitted PII, and `error.url`/`error.headers` can
 * carry identifiers. Only status, statusText and slug are attached.
 */
export function reportHttpFailure(error: any, slug: string, load: typeof loadSentryAngular = loadSentryAngular): void {
  const status = error?.status ?? 'unknown';
  const statusText = error?.statusText || error?.message || 'Unknown Error';
  load()?.then(Sentry => {
    Sentry.captureException(new Error(`HTTP ${status} (${statusText}) on ${slug}`), {
      level: httpFailureLevel(error),
      extra: { slug, status, statusText }
    });
  });
}
