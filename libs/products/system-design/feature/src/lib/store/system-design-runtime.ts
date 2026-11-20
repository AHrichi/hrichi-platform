import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { APP_MODE, type AppMode } from '@ah/platform/app-mode';
import { databaseName } from '@ah/platform/storage';
import {
  SystemDesignDatabase,
  SystemDesignLocalStore,
} from '@ah/products/system-design/data-access';

/**
 * Resolves the IndexedDB database name via `@ah/platform/storage`
 * (`databaseName(mode, 'system-design', 'system_design_db_v1')`, so the
 * portfolio demo gets `ah-demo-system-design`) and opens `SystemDesignLocalStore`.
 */
@Injectable({ providedIn: 'root' })
export class SystemDesignRuntime {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly mode: AppMode =
    inject(APP_MODE, { optional: true }) ?? 'standalone';
  private opened: Promise<SystemDesignLocalStore | null> | null = null;

  open(): Promise<SystemDesignLocalStore | null> {
    this.opened ??= this.connect();
    return this.opened;
  }

  private async connect(): Promise<SystemDesignLocalStore | null> {
    if (!this.browser || typeof indexedDB === 'undefined') {
      return null;
    }
    const name = await databaseName(
      this.mode,
      'system-design',
      'system_design_db_v1',
    );
    return new SystemDesignLocalStore(new SystemDesignDatabase(name));
  }
}
