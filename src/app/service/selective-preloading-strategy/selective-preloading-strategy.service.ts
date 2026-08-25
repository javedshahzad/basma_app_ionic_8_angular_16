import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

// Preloads only routes explicitly flagged `data: { preload: true }` — the
// tab-bar routes a user is one tap away from right after login — instead of
// either NoPreloading (every navigation refetches its chunk) or
// PreloadAllModules (which would download all ~65 role-gated routes for
// every user regardless of role).
@Injectable({ providedIn: 'root' })
export class SelectivePreloadingStrategyService implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    return route.data?.['preload'] ? load() : of(null);
  }
}
