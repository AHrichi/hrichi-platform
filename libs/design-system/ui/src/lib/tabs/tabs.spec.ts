import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { Tabs, type TabItem } from './tabs';

@Component({
  imports: [Tabs],
  template: `
    <ah-tabs
      [tabs]="tabs"
      [(selectedId)]="activeTab"
    />
  `,
})
class Host {
  tabs: readonly TabItem[] = [
    { id: 'tab1', label: 'Overview', count: 5 },
    { id: 'tab2', label: 'Details' },
  ];
  activeTab = 'tab1';
}

describe('Tabs', () => {
  it('renders tablist and switches tabs on click', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const buttons = fixture.nativeElement.querySelectorAll('.ah-tab');
    expect(buttons.length).toBe(2);
    expect(buttons[0].getAttribute('aria-selected')).toBe('true');
    expect(buttons[1].getAttribute('aria-selected')).toBe('false');

    buttons[1].click();
    await fixture.whenStable();

    expect(fixture.componentInstance.activeTab).toBe('tab2');
    expect(buttons[1].getAttribute('aria-selected')).toBe('true');
  });
});
