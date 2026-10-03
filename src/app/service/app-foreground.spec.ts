import { onAppForeground } from './app-foreground';

describe('onAppForeground', () => {
  const missingPlugin = () => Promise.reject({ code: 'UNIMPLEMENTED', message: '"App" plugin is not implemented on ios' });

  it('calls back only when the native app becomes active', () => {
    let native: (state: { isActive: boolean }) => void = () => {};
    let calls = 0;
    onAppForeground(
      () => calls++,
      cb => {
        native = cb;
        return Promise.resolve();
      }
    );
    native({ isActive: false });
    expect(calls).toBe(0);
    native({ isActive: true });
    expect(calls).toBe(1);
  });

  it('does not throw or reject when the native plugin is missing (Sentry 150606576), and uses visibilitychange', async () => {
    let calls = 0;
    expect(() => onAppForeground(() => calls++, missingPlugin)).not.toThrow();
    await new Promise(resolve => setTimeout(resolve)); // let the rejection settle

    spyOnProperty(document, 'visibilityState', 'get').and.returnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    expect(calls).toBe(1);
  });

  it('does not throw when addListener throws synchronously', () => {
    expect(() =>
      onAppForeground(
        () => {},
        () => {
          throw new Error('not implemented');
        }
      )
    ).not.toThrow();
  });
});
