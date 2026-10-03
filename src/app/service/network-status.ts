import { Network } from '@capacitor/network';

/**
 * The native Network plugin can be missing from an iOS binary built from an
 * out-of-date native project ('"Network" plugin is not implemented on ios',
 * Sentry issue 151059691). Unlike a screen-level feature, "are we online" sits
 * under every API call and every login, so a throw here stops the whole app.
 *
 * isNetworkConnected() never throws: it asks the plugin and, if the plugin
 * can't answer, falls back to the browser's own flag, which is what the web
 * build already relies on.
 */
export async function isNetworkConnected(
  read: () => Promise<{ connected: boolean }> = () => Network.getStatus()
): Promise<boolean> {
  try {
    return (await read()).connected;
  } catch (error) {
    console.warn('Native network status unavailable; using navigator.onLine.', error);
    return navigator.onLine;
  }
}

/**
 * Calls `callback` whenever connectivity changes. Uses the native plugin and,
 * when it's missing, the browser's online/offline events instead. Never throws.
 */
export function onNetworkChange(
  callback: (connected: boolean) => void,
  addListener: (cb: (status: { connected: boolean }) => void) => Promise<unknown> | unknown = cb =>
    Network.addListener('networkStatusChange', cb)
): void {
  const useBrowserEvents = () => {
    window.addEventListener('online', () => callback(true));
    window.addEventListener('offline', () => callback(false));
  };
  try {
    // addListener returns a promise that rejects when the plugin is missing.
    Promise.resolve(addListener(status => callback(status.connected))).catch(error => {
      console.warn('Native network listener unavailable; using browser events.', error);
      useBrowserEvents();
    });
  } catch (error) {
    console.warn('Native network listener unavailable; using browser events.', error);
    useBrowserEvents();
  }
}
