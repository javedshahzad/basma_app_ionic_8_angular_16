import { environment } from '../../../environments/environment';

type SentryAngularModule = typeof import('@sentry/angular');

let sentryAngularPromise: Promise<SentryAngularModule> | undefined;

/**
 * Sentry's packages (@sentry/core, browser, browser-utils, capacitor,
 * angular — ~177 KB combined) are only needed to *observe* the app, never
 * to run it, so they're kept out of the eager initial bundle. Every call
 * site (main.ts, GlobalErrorHandler, ApiClientService) goes through this
 * one function, so the dynamic import('@sentry/angular') specifier is
 * shared and webpack dedupes it into a single lazy chunk that starts
 * fetching in the background right after bootstrap instead of blocking it.
 * Returns undefined (no fetch at all) when no DSN is configured, matching
 * the previous behavior where Sentry.init() was a no-op without a DSN —
 * except now dev builds, which never set a DSN, don't pay for the chunk.
 */
export function loadSentryAngular(): Promise<SentryAngularModule> | undefined {
  if (!environment.sentryDsn) return undefined;
  if (!sentryAngularPromise) {
    sentryAngularPromise = import('@sentry/angular');
  }
  return sentryAngularPromise;
}
