import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AccordionItem } from './accordion-item';

@Component({
  imports: [AccordionItem],
  template: `
    <ah-accordion-item
      title="Branch 1: Core Fundamentals"
      subtitle="4 sections included"
      [expanded]="isExpanded"
    >
      <p class="body-text">Branch Content Here</p>
    </ah-accordion-item>
  `,
})
class Host {
  isExpanded = false;
}

describe('AccordionItem', () => {
  it('toggles expansion state and aria attributes on click', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const trigger = fixture.nativeElement.querySelector('.ah-accordion-trigger');
    const content = fixture.nativeElement.querySelector('.ah-accordion-content');

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(content.hasAttribute('hidden')).toBe(true);

    trigger.click();
    await fixture.whenStable();

    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    expect(content.hasAttribute('hidden')).toBe(false);
  });
});
