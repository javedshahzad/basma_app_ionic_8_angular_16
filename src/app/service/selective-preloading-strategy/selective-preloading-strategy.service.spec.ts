import { of } from 'rxjs';
import { Route } from '@angular/router';
import { SelectivePreloadingStrategyService } from './selective-preloading-strategy.service';

describe('SelectivePreloadingStrategyService', () => {
  let service: SelectivePreloadingStrategyService;

  beforeEach(() => {
    service = new SelectivePreloadingStrategyService();
  });

  it('calls load() for a route flagged data.preload = true', () => {
    const route: Route = { path: 'classlist', data: { preload: true } };
    const load = jasmine.createSpy('load').and.returnValue(of('loaded'));

    service.preload(route, load).subscribe();

    expect(load).toHaveBeenCalled();
  });

  it('does not call load() for a route without the preload flag', () => {
    const route: Route = { path: 'manage-teacher' };
    const load = jasmine.createSpy('load').and.returnValue(of('loaded'));

    service.preload(route, load).subscribe();

    expect(load).not.toHaveBeenCalled();
  });

  it('does not call load() for a route with data.preload = false', () => {
    const route: Route = { path: 'settings', data: { preload: false } };
    const load = jasmine.createSpy('load').and.returnValue(of('loaded'));

    service.preload(route, load).subscribe();

    expect(load).not.toHaveBeenCalled();
  });
});
