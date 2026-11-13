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

    const dismissBtn = fixture.nativeElement.querySelector(
      '.ah-alert-dismiss-btn',
    );
    expect(dismissBtn).toBeTruthy();

    dismissBtn.click();
    await fixture.whenStable();

    expect(hostElem.hasAttribute('hidden')).toBe(true);
  });

  it('supports configurable headingLevel without emitting skipped headings', async () => {
    @Component({
      imports: [Alert],
      template: `<ah-alert title="Banner" [headingLevel]="null"
        >Body</ah-alert
      >`,
    })
    class PlainHost {}

    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(PlainHost);
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('h4')).toBeNull();
    expect(
      fixture.nativeElement
        .querySelector('.ah-alert-title')
        ?.textContent?.trim(),
    ).toBe('Banner');
  });
});
