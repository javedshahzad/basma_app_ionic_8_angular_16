import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';

/**
 * The native Device plugin can be missing from an iOS binary built from an
 * out-of-date native project ('"Device" plugin is not implemented on ios',
 * Sentry issue 150606576). Reading the device id must not take boot or the
 * login screen down with it, so a failed read comes back as '' and callers
 * use the install id below, which is how the web build already identifies
 * itself.
 */
export async function getNativeDeviceId(
  read: () => Promise<{ identifier: string }> = () => Device.getId()
): Promise<string> {
  try {
    const identifier = (await read()).identifier;
    return identifier && identifier !== 'undefined' ? identifier : '';
  } catch (error) {
    console.warn('Native device id unavailable; using an install id instead.', error);
    return '';
  }
}

/** A random id for this install, created once and kept in storage. */
export async function getInstallId(storage: {
  get(key: string): Promise<any>;
  set(key: string, value: any): Promise<any>;
}): Promise<string> {
  let id = await storage.get('browser_uuid');
  if (!id) {
    id = 'BRW-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    await storage.set('browser_uuid', id);
  }
  return id;
}

/**
 * The os_type the API expects: 1 = Android, 2 = everything else. Uses
 * Capacitor itself, which needs no native plugin, rather than
 * Device.getInfo().
 */
export function currentOsType(): number {
  return Capacitor.getPlatform() === 'android' ? 1 : 2;
}
