import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { EmptyState } from './empty-state';

@Component({
  imports: [EmptyState],
  template: `
    <ah-empty-state
      title="No items found"
      description="Try creating one"
      icon="📂"
    >
      <button empty-actions type="button">Add</button>
    </ah-empty-state>
  `,
})
class Host {}

describe('EmptyState', () => {
  it('renders title, description and actions', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const title = fixture.nativeElement.querySelector('.ah-empty-state-title');
    const desc = fixture.nativeElement.querySelector('.ah-empty-state-desc');
    const action = fixture.nativeElement.querySelector('[empty-actions]');

    expect(title.textContent).toContain('No items found');
    expect(desc.textContent).toContain('Try creating one');
    expect(action).toBeTruthy();
  });
});
