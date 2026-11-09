import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { beforeAll, describe, expect, it } from 'vitest';
import { Modal } from './modal';

@Component({
  imports: [Modal],
  template: `
    <button type="button" class="opener" (click)="isOpen.set(true)">
      Open
    </button>
    <ah-modal
      [(open)]="isOpen"
      title="Order Details"
      eyebrow="Dispatch"
      size="md"
      [closeOnBackdrop]="closeOnBackdrop()"
      (closed)="closedCount = closedCount + 1"
    >
      <label for="name">Name</label>
      <input id="name" class="first-field" />
    </ah-modal>
  `,
})
class Host {
  readonly isOpen = signal(false);
  readonly closeOnBackdrop = signal(true);
  closedCount = 0;
}

async function setup() {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
  const fixture = TestBed.createComponent(Host);
  await fixture.whenStable();
  const el: HTMLElement = fixture.nativeElement;
  const dialog = el.querySelector('dialog') as HTMLDialogElement;
  const open = async () => {
    const opener = el.querySelector('.opener') as HTMLButtonElement;
    opener.focus();
    opener.click();
    await fixture.whenStable();
  };
  return { fixture, el, dialog, open };
}

describe('Modal', () => {
  beforeAll(() => {
    // jsdom has <dialog> but not always showModal()/close(); emulate them.
    const proto = HTMLDialogElement.prototype as HTMLDialogElement & {
      showModal?: () => void;
    };
    if (!proto.showModal) {
      proto.showModal = function (this: HTMLDialogElement) {
        this.setAttribute('open', '');
      };
      proto.close = function (this: HTMLDialogElement) {
        this.removeAttribute('open');
      };
    }
  });

  it('renders nothing inside the dialog while closed', async () => {
    const { dialog } = await setup();
    expect(dialog.open).toBe(false);
    expect(dialog.querySelector('.ah-modal-title')).toBeNull();
  });

  it('opens as a labelled native dialog and focuses the first field', async () => {
    const { el, dialog, open } = await setup();
    await open();

    expect(dialog.open).toBe(true);
    const title = el.querySelector('.ah-modal-title') as HTMLElement;
    expect(title.textContent).toBe('Order Details');
    expect(dialog.getAttribute('aria-labelledby')).toBe(title.id);
    expect(el.querySelector('.ah-eyebrow')?.textContent).toBe('Dispatch');
    expect(document.activeElement).toBe(el.querySelector('.first-field'));
    expect(
      document.documentElement.classList.contains('ah-scroll-locked'),
    ).toBe(true);
  });

  it('closes on Escape (cancel), emits once, and returns focus to the opener', async () => {
    const { fixture, el, dialog, open } = await setup();
    await open();

    dialog.dispatchEvent(new Event('cancel', { cancelable: true }));
    await fixture.whenStable();

    expect(fixture.componentInstance.isOpen()).toBe(false);
    expect(fixture.componentInstance.closedCount).toBe(1);
    expect(dialog.open).toBe(false);
    expect(document.activeElement).toBe(el.querySelector('.opener'));
    expect(
      document.documentElement.classList.contains('ah-scroll-locked'),
    ).toBe(false);
  });

  it('closes on a backdrop click only when allowed', async () => {
    const { fixture, dialog, open } = await setup();
    await open();

    fixture.componentInstance.closeOnBackdrop.set(false);
    await fixture.whenStable();
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.isOpen()).toBe(true);

    fixture.componentInstance.closeOnBackdrop.set(true);
    await fixture.whenStable();
    dialog.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.isOpen()).toBe(false);
  });

  it('ignores clicks inside the dialog surface', async () => {
    const { fixture, el, open } = await setup();
    await open();
    (el.querySelector('.ah-modal-body') as HTMLElement).click();
    await fixture.whenStable();
    expect(fixture.componentInstance.isOpen()).toBe(true);
  });
});
