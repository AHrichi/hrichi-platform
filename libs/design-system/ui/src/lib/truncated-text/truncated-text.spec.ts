import { Component, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { TruncatedText } from './truncated-text';

@Component({
  imports: [TruncatedText],
  template: `
    <ah-truncated-text
      [text]="longText"
      [tooltipTitle]="title"
      [maxWidth]="'120px'"
      [interactive]="true"
    />
  `,
})
class TestHost {
  longText = 'This is an exceptionally long piece of text that should truncate gracefully with a popover tooltip';
  title = 'Full Description';
}

describe('TruncatedText Component', () => {
  let fixture: ComponentFixture<TestHost>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHost],
      providers: [provideZonelessChangeDetection()],
    });
    fixture = TestBed.createComponent(TestHost);
    fixture.detectChanges();
  });

  it('renders truncated text with title attribute', () => {
    const el = fixture.nativeElement as HTMLElement;
    const content = el.querySelector('.ah-truncate-content');
    expect(content).toBeTruthy();
    expect(content?.textContent?.trim()).toContain('This is an exceptionally long');
    expect(content?.getAttribute('title')).toBe(fixture.componentInstance.longText);
  });

  it('opens and closes tooltip on hover / click', () => {
    const el = fixture.nativeElement as HTMLElement;
    const host = el.querySelector('ah-truncated-text') as HTMLElement;
    expect(el.querySelector('.ah-truncate-popover')).toBeNull();

    // Trigger mouse enter
    host.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(el.querySelector('.ah-truncate-popover')).toBeTruthy();
    expect(el.querySelector('.ah-truncate-popover-title')?.textContent?.trim()).toBe('Full Description');
    expect(el.querySelector('.ah-truncate-popover-body')?.textContent?.trim()).toBe(fixture.componentInstance.longText);

    // Trigger mouse leave
    host.dispatchEvent(new MouseEvent('mouseleave'));
    fixture.detectChanges();
    expect(el.querySelector('.ah-truncate-popover')).toBeNull();
  });
});
