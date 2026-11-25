import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import type { SiteLanguage } from '@ah/shared/state';
import { SERRA_LANGUAGES, SerraI18n } from '../../i18n/serra-i18n';
import { Icon } from '../icon/icon';

let nextId = 0;

/**
 * The language switch: one button with a globe and the language in use,
 * opening a short menu where each language is written in itself. Arrow keys
 * move through it, Escape closes it and a click outside dismisses it.
 */
@Component({
  selector: 'sc-lang-menu',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:pointerdown)': 'onPointerDown($event)',
    '(focusout)': 'onFocusOut($event)',
  },
  template: `
    <button
      #trigger
      type="button"
      class="trigger"
      aria-haspopup="menu"
      [attr.aria-expanded]="open()"
      [attr.aria-controls]="open() ? menuId : null"
      (click)="toggle()"
      (keydown.arrowdown)="openAndFocus($event, 'checked')"
      (keydown.arrowup)="openAndFocus($event, 'last')"
    >
      <sc-icon name="globe" />
      <!-- Named "Language: EN" on phones, "Language: English" wider: the
           visible text is always part of the name. -->
      <span class="ah-visually-hidden">{{ t().app.language }}: </span>
      <span class="code" [attr.lang]="current().id">{{ current().label }}</span>
      <span class="name" [attr.lang]="current().id">{{
        current().nativeName
      }}</span>
      <sc-icon class="chevron" name="chevron" />
    </button>
    @if (open()) {
      <ul
        #menu
        class="menu"
        role="menu"
        [id]="menuId"
        [attr.aria-label]="t().app.language"
      >
        @for (lang of languages; track lang.id) {
          <li role="none">
            <button
              type="button"
              role="menuitemradio"
              tabindex="-1"
              [attr.aria-checked]="lang.id === current().id"
              [attr.lang]="lang.id"
              [attr.dir]="lang.id === 'ar' ? 'rtl' : 'ltr'"
              (click)="choose(lang.id)"
              (keydown)="onMenuKey($event)"
            >
              <span class="native">{{ lang.nativeName }}</span>
              <span class="code" aria-hidden="true">{{ lang.label }}</span>
              <sc-icon class="tick" name="check" />
            </button>
          </li>
        }
      </ul>
    }
  `,
  styleUrl: './lang-menu.scss',
})
export class LangMenu {
  private readonly i18n = inject(SerraI18n);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  protected readonly t = this.i18n.t;
  protected readonly languages = SERRA_LANGUAGES;
  protected readonly menuId = `sc-lang-menu-${++nextId}`;
  protected readonly open = signal(false);
  private readonly trigger =
    viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly menu = viewChild<ElementRef<HTMLElement>>('menu');

  protected readonly current = computed(
    () =>
      SERRA_LANGUAGES.find((l) => l.id === this.i18n.lang()) ??
      SERRA_LANGUAGES[0],
  );

  protected toggle(): void {
    if (this.open()) this.close(true);
    else this.openAndFocus(null, 'checked');
  }

  protected openAndFocus(event: Event | null, at: 'checked' | 'last'): void {
    event?.preventDefault();
    this.open.set(true);
    // The menu renders on the next change detection: focus it then.
    queueMicrotask(() =>
      requestAnimationFrame(() => {
        const items = this.items();
        const index =
          at === 'last'
            ? items.length - 1
            : Math.max(
                0,
                items.findIndex(
                  (b) => b.getAttribute('aria-checked') === 'true',
                ),
              );
        items[index]?.focus();
      }),
    );
  }

  protected choose(id: SiteLanguage): void {
    this.i18n.setLanguage(id);
    this.close(true);
  }

  protected onMenuKey(event: KeyboardEvent): void {
    const items = this.items();
    const at = items.indexOf(document.activeElement as HTMLButtonElement);
    const go = (i: number) => {
      event.preventDefault();
      items[(i + items.length) % items.length]?.focus();
    };
    switch (event.key) {
      case 'ArrowDown':
        return go(at + 1);
      case 'ArrowUp':
        return go(at - 1);
      case 'Home':
        return go(0);
      case 'End':
        return go(items.length - 1);
      case 'Escape':
        event.preventDefault();
        return this.close(true);
      case 'Tab':
        return this.close(false);
    }
  }

  protected onPointerDown(event: PointerEvent): void {
    if (!this.open()) return;
    if (!this.host.nativeElement.contains(event.target as Node)) {
      this.close(false);
    }
  }

  /** Focus leaving the switch (Tab, a screen reader's jump) closes it. */
  protected onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (this.open() && next && !this.host.nativeElement.contains(next)) {
      this.close(false);
    }
  }

  private close(returnFocus: boolean): void {
    if (!this.open()) return;
    this.open.set(false);
    if (returnFocus) this.trigger().nativeElement.focus();
  }

  private items(): HTMLButtonElement[] {
    const menu = this.menu()?.nativeElement;
    return menu ? [...menu.querySelectorAll<HTMLButtonElement>('button')] : [];
  }
}
