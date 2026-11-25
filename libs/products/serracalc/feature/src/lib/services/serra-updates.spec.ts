import '@angular/compiler';
import { DOCUMENT } from '@angular/common';
import { Injector } from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { SwUpdate, type VersionEvent } from '@angular/service-worker';
import { Subject } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { SerraUpdates } from './serra-updates';

function setup(enabled = true) {
  const versionUpdates = new Subject<VersionEvent>();
  const unrecoverable = new Subject<{ type: 'UNRECOVERABLE_STATE' }>();
  const worker = {
    isEnabled: enabled,
    versionUpdates,
    unrecoverable,
    checkForUpdate: vi.fn(async () => false),
    activateUpdate: vi.fn(async () => true),
  };
  const events = new Subject<unknown>();
  const listeners: Record<string, () => void> = {};
  const window = {
    document: {
      visibilityState: 'visible',
      addEventListener: (name: string, fn: () => void) => {
        listeners[name] = fn;
      },
    },
    setInterval: vi.fn(),
    location: { reload: vi.fn(), assign: vi.fn() },
    navigator: {},
  };
  const injector = Injector.create({
    providers: [
      SerraUpdates,
      { provide: SwUpdate, useValue: worker },
      { provide: DOCUMENT, useValue: { defaultView: window } },
      { provide: Router, useValue: { events } },
    ],
  });
  const updates = injector.get(SerraUpdates);
  return { updates, worker, events, window, listeners };
}

describe('SerraUpdates', () => {
  it('offers a reload once a new version is downloaded', async () => {
    const { updates, worker, window } = setup();
    updates.start();
    expect(updates.visible()).toBe(false);
    worker.versionUpdates.next({
      type: 'VERSION_READY',
    } as unknown as VersionEvent);
    expect(updates.state()).toBe('ready');
    expect(updates.visible()).toBe(true);

    await updates.reload();
    expect(worker.activateUpdate).toHaveBeenCalled();
    expect(window.location.reload).toHaveBeenCalled();
  });

  it('looks again when the tab comes back, and loads the next screen fresh', async () => {
    const { updates, worker, events, window, listeners } = setup();
    updates.start();
    listeners['visibilitychange']();
    expect(worker.checkForUpdate).toHaveBeenCalledTimes(1);

    worker.versionUpdates.next({
      type: 'VERSION_READY',
    } as unknown as VersionEvent);
    events.next(new NavigationStart(1, '/heating'));
    await Promise.resolve();
    await Promise.resolve();
    expect(window.location.assign).toHaveBeenCalledWith('/heating');
  });

  it('can be put off, and says when the cached copy is broken', () => {
    const { updates, worker } = setup();
    updates.start();
    worker.unrecoverable.next({ type: 'UNRECOVERABLE_STATE' });
    expect(updates.state()).toBe('broken');
    updates.dismiss();
    expect(updates.visible()).toBe(false);
  });

  it('does nothing without a service worker (development, the portfolio)', () => {
    const { updates, worker } = setup(false);
    updates.start();
    worker.versionUpdates.next({
      type: 'VERSION_READY',
    } as unknown as VersionEvent);
    expect(updates.state()).toBe('none');
  });
});
