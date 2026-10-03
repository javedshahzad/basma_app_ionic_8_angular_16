import { currentOsType, getInstallId, getNativeDeviceId } from './device-id';

describe('device id helpers', () => {
  describe('getNativeDeviceId', () => {
    it('returns the native id when the plugin works', async () => {
      expect(await getNativeDeviceId(async () => ({ identifier: 'abc-123' }))).toBe('abc-123');
    });

    it('returns an empty string, and does not throw, when the plugin is missing from the binary', async () => {
      // Sentry issue 150606576: '"Device" plugin is not implemented on ios'
      const missing = () => Promise.reject({ code: 'UNIMPLEMENTED', message: '"Device" plugin is not implemented on ios' });
      expect(await getNativeDeviceId(missing)).toBe('');
    });

    it('treats an empty or "undefined" id as no id', async () => {
      expect(await getNativeDeviceId(async () => ({ identifier: '' }))).toBe('');
      expect(await getNativeDeviceId(async () => ({ identifier: 'undefined' }))).toBe('');
    });
  });

  describe('getInstallId', () => {
    function fakeStorage(initial: Record<string, any> = {}) {
      const data = { ...initial };
      return {
        data,
        get: async (key: string) => data[key] ?? null,
        set: async (key: string, value: any) => {
          data[key] = value;
        }
      };
    }

    it('creates an id once and keeps it', async () => {
      const storage = fakeStorage();
      const first = await getInstallId(storage);
      expect(first).toMatch(/^BRW-/);
      expect(await getInstallId(storage)).toBe(first);
      expect(storage.data['browser_uuid']).toBe(first);
    });

    it('reuses an existing id', async () => {
      expect(await getInstallId(fakeStorage({ browser_uuid: 'BRW-EXISTING' }))).toBe('BRW-EXISTING');
    });
  });

  it('currentOsType is 2 outside Android (the test browser is web)', () => {
    expect(currentOsType()).toBe(2);
  });
});
