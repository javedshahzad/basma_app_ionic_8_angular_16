import { getPhotoOrNull, isPhotoPickerCancelled } from './photo-picker';

describe('photo picker', () => {
  const options = { quality: 80 } as never;

  it('recognises the cancel messages Capacitor throws (Sentry 150599335)', () => {
    expect(isPhotoPickerCancelled({ message: 'User cancelled photos app' })).toBeTrue();
    expect(isPhotoPickerCancelled(new Error('User cancelled photos app'))).toBeTrue();
    expect(isPhotoPickerCancelled('User cancelled photos app')).toBeTrue();
  });

  it('does not treat other failures as a cancel', () => {
    expect(isPhotoPickerCancelled({ message: 'User denied access to camera' })).toBeFalse();
    expect(isPhotoPickerCancelled(undefined)).toBeFalse();
    expect(isPhotoPickerCancelled({})).toBeFalse();
  });

  it('returns the photo when the user picks one', async () => {
    const photo = { base64String: 'abc', format: 'jpeg', saved: false };
    expect(await getPhotoOrNull(options, () => Promise.resolve(photo))).toBe(photo);
  });

  it('resolves to null instead of rejecting when the user cancels', async () => {
    const cancelled = () => Promise.reject({ message: 'User cancelled photos app' });
    expect(await getPhotoOrNull(options, cancelled)).toBeNull();
  });

  it('still rejects for a real failure such as a denied permission', async () => {
    const denied = () => Promise.reject(new Error('User denied access to camera'));
    await expectAsync(getPhotoOrNull(options, denied)).toBeRejectedWithError('User denied access to camera');
  });
});
