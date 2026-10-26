import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PreferencesStore } from '@ah/shared/state';
import { HomePage } from './home-page';

async function setup() {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), provideRouter([])],
  });
  const fixture = TestBed.createComponent(HomePage);
  await fixture.whenStable();
  const element = fixture.nativeElement as HTMLElement;
  const sectionHeadings = () =>
    Array.from(element.querySelectorAll('section[aria-labelledby] h2')).map(
      (h) => h.textContent?.trim(),
    );
  return { fixture, element, sectionHeadings };
}

describe('HomePage', () => {
  it('renders the recruiter view by default', async () => {
    const { element, sectionHeadings } = await setup();

    expect(element.querySelector('h1')?.textContent).toContain(
      '5+ years of enterprise SaaS',
    );
    expect(sectionHeadings()[0]).toContain('5+ years of Angular');
  });

  it('reorders sections and shows the right work for another audience', async () => {
    const { fixture, element, sectionHeadings } = await setup();

    TestBed.inject(PreferencesStore).setAudience('client');
    await fixture.whenStable();

    expect(element.querySelector('h1')?.textContent).toContain(
      'integration work for product teams',
    );
    expect(sectionHeadings()[0]).toBe('How I can help');
    const firstCase = element.querySelector('ah-link-card h3');
    expect(firstCase?.textContent).toContain('plug-and-play integration');
  });

  it('adds Person structured data for search engines', async () => {
    await setup();

    const ld = document.head.querySelector('script[data-ld="person"]');
    expect(JSON.parse(ld?.textContent ?? '{}')['@type']).toBe('Person');
  });
});
