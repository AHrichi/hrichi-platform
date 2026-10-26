import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';

/** The part of Cloudflare's Turnstile API the form uses. */
interface TurnstileApi {
  render(
    container: HTMLElement,
    options: {
      sitekey: string;
      theme?: 'auto' | 'light' | 'dark';
      size?: 'normal' | 'flexible' | 'compact';
      callback: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
    },
  ): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

export interface TurnstileWidget {
  reset(): void;
  remove(): void;
}

const scriptUrl =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

/** Loads Turnstile once (only on pages that show a form) and renders widgets. */
@Injectable({ providedIn: 'root' })
export class TurnstileService {
  private readonly document = inject(DOCUMENT);
  private api?: Promise<TurnstileApi>;

  async render(
    container: HTMLElement,
    siteKey: string,
    onToken: (token: string | null) => void,
  ): Promise<TurnstileWidget> {
    const api = await this.load();
    const id = api.render(container, {
      sitekey: siteKey,
      theme: 'auto',
      size: 'flexible',
      callback: (token) => onToken(token),
      'expired-callback': () => onToken(null),
      'error-callback': () => onToken(null),
    });
    return {
      reset: () => {
        onToken(null);
        api.reset(id);
      },
      remove: () => api.remove(id),
    };
  }

  private load(): Promise<TurnstileApi> {
    const window = this.document.defaultView as
      (Window & { turnstile?: TurnstileApi }) | null;
    this.api ??= new Promise<TurnstileApi>((resolve, reject) => {
      if (window?.turnstile) {
        resolve(window.turnstile);
        return;
      }
      const script = this.document.createElement('script');
      script.src = scriptUrl;
      script.async = true;
      script.onload = () =>
        window?.turnstile
          ? resolve(window.turnstile)
          : reject(new Error('Turnstile did not load'));
      script.onerror = () => reject(new Error('Turnstile did not load'));
      this.document.head.appendChild(script);
    }).catch((error) => {
      // Let a later visit to the page try again.
      this.api = undefined;
      throw error;
    });
    return this.api;
  }
}
