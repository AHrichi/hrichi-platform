import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Modal } from './modal';

@Component({
  imports: [Modal],
  template: `
    <ah-modal
      [open]="isOpen"
      title="Order Details"
      eyebrow="Dispatch"
      size="md"
    >
      <p>Modal body content</p>
    </ah-modal>
  `,
})
class Host {
  isOpen = true;
}

describe('Modal', () => {
  it('renders modal dialog with accessible attributes when open', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const dialog = fixture.nativeElement.querySelector('[role="dialog"]');
    expect(dialog).toBeTruthy();
    expect(dialog.getAttribute('aria-modal')).toBe('true');

    const title = fixture.nativeElement.querySelector('.ah-modal-title');
    expect(title.textContent).toBe('Order Details');

    const eyebrow = fixture.nativeElement.querySelector('.ah-eyebrow');
    expect(eyebrow.textContent).toBe('Dispatch');
  });
});
