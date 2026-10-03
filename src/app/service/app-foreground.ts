import { App } from '@capacitor/app';

/**
 * Calls `callback` each time the app comes back to the foreground.
 *
 * Uses the native App plugin and, when the plugin is missing from the binary
 * ('"App" plugin is not implemented on ios', Sentry issue 150606576), the
 * browser's visibilitychange event instead. addListener() returns a promise
 * that rejects in that case, and the one call site had nothing catching it,
 * so it surfaced as an unhandled error on every launch. Never throws.
 */
export function onAppForeground(
  callback: () => void,
  addListener: (cb: (state: { isActive: boolean }) => void) => Promise<unknown> | unknown = cb =>
    App.addListener('appStateChange', cb)
): void {
  const useBrowserEvent = () => {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') callback();
    });
  };
  try {
    Promise.resolve(addListener(state => state.isActive && callback())).catch(error => {
      console.warn('Native app-state listener unavailable; using visibilitychange.', error);
      useBrowserEvent();
    });
  } catch (error) {
    console.warn('Native app-state listener unavailable; using visibilitychange.', error);
    useBrowserEvent();
  }
}
