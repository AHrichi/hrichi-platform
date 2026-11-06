import { TestBed } from '@angular/core/testing';
import { Route, Router, provideRouter } from '@angular/router';
import { describe, expect, it } from 'vitest';
import { appAvailableGuard } from './app-available.guard';

describe('appAvailableGuard', () => {
  it('allows access when the app is enabled', () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });

    TestBed.runInInjectionContext(() => {
      const guard = appAvailableGuard('lighting');
      const result = guard({} as Route, [], {} as any);
      expect(result).toBe(true);
    });
  });

  it('redirects to /apps when the app is disabled', () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });

    TestBed.runInInjectionContext(() => {
      const router = TestBed.inject(Router);
      const guard = appAvailableGuard('strategy');
      const result = guard({} as Route, [], {} as any);

      expect(result).toEqual(router.createUrlTree(['/apps']));
    });
  });
});
