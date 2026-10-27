import { Injectable, signal } from '@angular/core';
import { db } from '../financial.store';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  isDarkMode = signal(false);

  constructor() {
    this.loadTheme();
  }

  private async loadTheme() {
    try {
      const rec = await db.settings.get('theme');
      if (rec?.value === 'dark') {
        this.isDarkMode.set(true);
      }
    } catch {}
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
