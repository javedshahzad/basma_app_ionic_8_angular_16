import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { Platform } from '@ionic/angular';

import { ConnectivityService } from './connectivity.service';

describe('ConnectivityService', () => {
  let service: ConnectivityService;
  let navigatorOnline: jasmine.Spy;

  const setNavigatorOnline = (online: boolean) => navigatorOnline.and.returnValue(online);

  beforeEach(() => {
    navigatorOnline = spyOnProperty(navigator, 'onLine', 'get').and.returnValue(true);
    TestBed.configureTestingModule({
      providers: [{ provide: Platform, useValue: { is: () => false, resume: { subscribe: () => {} } } }]
    });
    service = TestBed.inject(ConnectivityService);
  });

  it('starts online and says nothing about a reconnect', () => {
    expect(service.isOnline()).toBeTrue();
    expect(service.justReconnected()).toBeFalse();
  });

  it('stays silent when the system reports "online" while already online (every app launch)', fakeAsync(() => {
    window.dispatchEvent(new Event('online'));
    tick(5000);
    expect(service.isOnline()).toBeTrue();
    expect(service.justReconnected()).toBeFalse();
  }));

  it('ignores a blip shorter than the 2 second debounce', fakeAsync(() => {
    window.dispatchEvent(new Event('offline'));
    tick(1000);
    window.dispatchEvent(new Event('online'));
    tick(5000);
    expect(service.isOnline()).toBeTrue();
    expect(service.justReconnected()).toBeFalse();
  }));

  it('goes offline after the debounce and flashes "back online" once for 3 seconds on reconnect', fakeAsync(() => {
    setNavigatorOnline(false);
    window.dispatchEvent(new Event('offline'));
    tick(2000);
    expect(service.isOnline()).toBeFalse();
    expect(service.justReconnected()).toBeFalse();

    setNavigatorOnline(true);
    window.dispatchEvent(new Event('online'));
    expect(service.isOnline()).toBeTrue();
    expect(service.justReconnected()).toBeTrue();

    tick(2999);
    expect(service.justReconnected()).toBeTrue();
    tick(1);
    expect(service.justReconnected()).toBeFalse();
  }));

  it('does not announce a reconnect when refresh() merely confirms it is online', fakeAsync(() => {
    let result: boolean | undefined;
    service.refresh().then(connected => (result = connected));
    tick();
    expect(result).toBeTrue();
    expect(service.justReconnected()).toBeFalse();
  }));
});
