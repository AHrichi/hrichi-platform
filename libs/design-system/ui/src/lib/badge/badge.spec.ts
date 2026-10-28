import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Badge } from './badge';

@Component({
  imports: [Badge],
  template: `
    <ah-badge variant="success" [dot]="true" [pulse]="true" size="sm">
      Active
    </ah-badge>
  `,
})
class Host {}

describe('Badge', () => {
  it('renders dot, pulse class and variant correctly', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const badge = fixture.nativeElement.querySelector('ah-badge');
    expect(badge.className).toContain('ah-badge--success');
    expect(badge.className).toContain('ah-badge--sm');

    const dot = fixture.nativeElement.querySelector('.ah-badge-dot');
    expect(dot).toBeTruthy();
    expect(dot.className).toContain('ah-badge-dot--pulse');

    expect(badge.textContent).toContain('Active');
  });
});
