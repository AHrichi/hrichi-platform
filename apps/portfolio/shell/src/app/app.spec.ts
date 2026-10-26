import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
  });

  it('renders the main navigation and a skip link', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const links = Array.from(element.querySelectorAll('nav a')).map((a) =>
      a.textContent?.trim(),
    );

    expect(links).toEqual(['Work', 'Experience', 'Services', 'Contact', 'CV']);
    expect(element.querySelector('.ah-skip-link')?.getAttribute('href')).toBe(
      '#main',
    );
  });
});
