import { isNetworkConnected, onNetworkChange } from './network-status';

describe('network status helpers', () => {
  const missingPlugin = () => Promise.reject({ code: 'UNIMPLEMENTED', message: '"Network" plugin is not implemented on ios' });

  describe('isNetworkConnected', () => {
    it('returns what the plugin reports', async () => {
      expect(await isNetworkConnected(async () => ({ connected: true }))).toBeTrue();
      expect(await isNetworkConnected(async () => ({ connected: false }))).toBeFalse();
    });

    it('does not throw when the native plugin is missing, and uses the browser flag', async () => {
      // Sentry issue 151059691: '"Network" plugin is not implemented on ios'.
      // This sits under every API call and login, so a throw here stops the app.
      expect(await isNetworkConnected(missingPlugin)).toBe(navigator.onLine);
    });
  });

  describe('onNetworkChange', () => {
    it('forwards native changes to the callback', () => {
      let native: (status: { connected: boolean }) => void = () => {};
      const seen: boolean[] = [];
      onNetworkChange(
        connected => seen.push(connected),
        cb => {
          native = cb;
          return Promise.resolve();
        }
      );
      native({ connected: false });
      native({ connected: true });
      expect(seen).toEqual([false, true]);
    });

    it('falls back to browser online/offline events when the plugin is missing', async () => {
      const seen: boolean[] = [];
      onNetworkChange(connected => seen.push(connected), missingPlugin);
      await new Promise(resolve => setTimeout(resolve)); // let the rejection settle

      window.dispatchEvent(new Event('offline'));
      window.dispatchEvent(new Event('online'));
      expect(seen.slice(-2)).toEqual([false, true]);
    });

    it('does not throw when addListener throws synchronously', () => {
      expect(() =>
        onNetworkChange(
          () => {},
          () => {
            throw new Error('not implemented');
          }
        )
      ).not.toThrow();
    });
  });
});
