import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Alert } from './alert';

@Component({
  imports: [Alert],
  template: `
    <ah-alert variant="danger" title="Validation Failed" [dismissible]="true">
      Topic is out of bounds
    </ah-alert>
  `,
})
class Host {}

describe('Alert', () => {
  it('renders title, message and handles dismissal', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const hostElem = fixture.nativeElement.querySelector('ah-alert');
    expect(hostElem.getAttribute('role')).toBe('alert');
    expect(hostElem.textContent).toContain('Validation Failed');
    expect(hostElem.textContent).toContain('Topic is out of bounds');

    const dismissBtn = fixture.nativeElement.querySelector('.ah-alert-dismiss-btn');
    expect(dismissBtn).toBeTruthy();

    dismissBtn.click();
    await fixture.whenStable();

    expect(hostElem.hasAttribute('hidden')).toBe(true);
  });
});
