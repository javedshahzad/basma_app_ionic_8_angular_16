import { Camera, GalleryPhoto, ImageOptions, Photo } from '@capacitor/camera';

/**
 * True when the user backed out of the camera or photo picker. Capacitor
 * reports that as a rejected promise ("User cancelled photos app"), which is a
 * normal outcome and not a failure.
 */
export function isPhotoPickerCancelled(error: unknown): boolean {
  const message = typeof error === 'string' ? error : (error as { message?: unknown } | null)?.message;
  return typeof message === 'string' && /cancel/i.test(message);
}

/**
 * Camera.getPhoto() that resolves to null when the user cancels, so a call site
 * with no try/catch doesn't leave an unhandled rejection (Sentry 150599335).
 * Real failures, such as a denied permission, still reject.
 */
export async function getPhotoOrNull(
  options: ImageOptions,
  getPhoto: (options: ImageOptions) => Promise<Photo | GalleryPhoto> = o => Camera.getPhoto(o)
): Promise<Photo | null> {
  try {
    return (await getPhoto(options)) as Photo;
  } catch (error) {
    if (isPhotoPickerCancelled(error)) {
      return null;
    }
    throw error;
  }
}
