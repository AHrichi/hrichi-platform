import { DOCUMENT } from '@angular/common';
import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { personJsonLd, Seo } from './seo';

describe('Seo', () => {
  let seo: Seo;
  let document: Document;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    seo = TestBed.inject(Seo);
    document = TestBed.inject(DOCUMENT);
  });

  it('sets title, description, canonical and Open Graph tags', () => {
    seo.update({
      title: 'Work',
      description: 'Case studies.',
      path: '/work',
    });

    expect(document.title).toBe('Work · Ahmed Hrichi');
    expect(
      document
        .querySelector('meta[name="description"]')
        ?.getAttribute('content'),
    ).toBe('Case studies.');
    expect(
      document.querySelector('link[rel="canonical"]')?.getAttribute('href'),
    ).toBe('https://portfolio.ahmed-hrichi.workers.dev/work');
    expect(
      document
        .querySelector('meta[property="og:url"]')
        ?.getAttribute('content'),
    ).toBe('https://portfolio.ahmed-hrichi.workers.dev/work');
  });

  it('keeps a single canonical link across navigations', () => {
    seo.update({ description: 'Home.', path: '/' });
    seo.update({ title: 'CV', description: 'CV.', path: '/cv' });

    expect(document.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    expect(document.title).toBe('CV · Ahmed Hrichi');
  });

  it('adds and replaces JSON-LD by id', () => {
    seo.setJsonLd('person', personJsonLd());
    seo.setJsonLd('person', { replaced: true });

    const blocks = document.querySelectorAll(
      'script[type="application/ld+json"][data-ld="person"]',
    );
    expect(blocks.length).toBe(1);
    expect(blocks[0].textContent).toBe('{"replaced":true}');

    seo.removeJsonLd('person');
    expect(document.querySelector('[data-ld="person"]')).toBeNull();
  });
});
