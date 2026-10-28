import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';
import { db } from '../financial.store';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  isDarkMode = signal(false);

  constructor() {
    this.loadTheme();
    this.observeDocumentTheme();
  }

  private observeDocumentTheme(): void {
    if (typeof document === 'undefined') return;
    try {
      const observer = new MutationObserver(() => {
        const docTheme = this.doc?.documentElement?.getAttribute('data-theme');
        if (docTheme === 'dark') {
          this.isDarkMode.set(true);
        } else if (docTheme === 'light') {
          this.isDarkMode.set(false);
        }
      });
      observer.observe(this.doc.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme'],
      });
    } catch {
      // MutationObserver not available in test or limited environment
    }
  }

  private async loadTheme() {
    try {
      const docTheme = this.doc?.documentElement?.getAttribute('data-theme');
      if (docTheme === 'dark') {
        this.isDarkMode.set(true);
        return;
      }
      if (docTheme === 'light') {
        this.isDarkMode.set(false);
        return;
      }

      const rec = await db.settings.get('theme');
      if (rec?.value === 'dark') {
        this.isDarkMode.set(true);
        return;
      }
      if (rec?.value === 'light') {
        this.isDarkMode.set(false);
        return;
      }

      const window = this.doc?.defaultView;
      if (window?.matchMedia?.('(prefers-color-scheme: dark)')?.matches) {
        this.isDarkMode.set(true);
      }
    } catch {
      const window = this.doc?.defaultView;
      if (window?.matchMedia?.('(prefers-color-scheme: dark)')?.matches) {
        this.isDarkMode.set(true);
      }
    }
  }

  toggleTheme() {
    this.isDarkMode.update((dark) => {
      const next = !dark;
      this.saveTheme(next);
      return next;
    });
  }

  private async saveTheme(dark: boolean) {
    try {
      await db.settings.put({ key: 'theme', value: dark ? 'dark' : 'light' });
    } catch {}
  }
}
