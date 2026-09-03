import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

/**
 * reCAPTCHA v3 (invisible, score-based -- no widget/checkbox) for the
 * login and school-registration forms, mirroring basmacp-admin's Turnstile
 * addition on its own login. `execute()` lazy-loads Google's script once
 * and resolves a fresh per-submission token; verification of the token
 * (and its score) happens server-side in staging.basmapp, never trusted
 * client-side.
 *
 * Native-app note: this runs inside the Capacitor WebView
 * (https://localhost on iOS, http://localhost on Android). Google's
 * reCAPTCHA admin console needs those origins added under the site's
 * allowed domains, or verification will fail for native builds even
 * though it works fine in a browser/staging web build.
 */
@Injectable({ providedIn: 'root' })
export class RecaptchaService {
  private scriptLoadPromise: Promise<void> | null = null;

  private loadScript(): Promise<void> {
    if (this.scriptLoadPromise) return this.scriptLoadPromise;

    this.scriptLoadPromise = new Promise((resolve, reject) => {
      if (window.grecaptcha) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${environment.recaptchaSiteKey}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load reCAPTCHA script'));
      document.head.appendChild(script);
    });

    return this.scriptLoadPromise;
  }

  /**
   * @param action e.g. 'login', 'register' -- checked against the token
   * server-side so a token minted for one action can't be replayed on another.
   * @returns the token, or '' if reCAPTCHA couldn't load/execute (e.g. no
   * network, ad-blocker) -- callers submit anyway and let the backend's own
   * decision (reject vs. soft-allow) apply, rather than blocking the whole
   * form on a third-party script failing to load.
   */
  async execute(action: string): Promise<string> {
    if (!environment.recaptchaSiteKey) return '';
    try {
      await this.loadScript();
      return await new Promise<string>((resolve, reject) => {
        window.grecaptcha!.ready(() => {
          window.grecaptcha!.execute(environment.recaptchaSiteKey, { action }).then(resolve).catch(reject);
        });
      });
    } catch {
      return '';
    }
  }
}
