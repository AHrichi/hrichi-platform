import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { profile, site } from '@ah/shared/content';

export interface PageMeta {
  /** Page name; the site name is appended. Omit on the home page. */
  title?: string;
  description: string;
  /** Path from the site root, e.g. /work/this-platform */
  path: string;
  type?: 'website' | 'article' | 'profile';
}

/**
 * Per-page title, description, canonical URL, Open Graph and JSON-LD. Runs
 * during prerendering too, so crawlers get the tags without JavaScript.
 */
@Injectable({ providedIn: 'root' })
export class Seo {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);

  update({ title, description, path, type = 'website' }: PageMeta): void {
    const fullTitle = title
      ? `${title} · ${site.name}`
      : `${site.name} · ${profile.role}`;
    const url = new URL(path, site.url).href;

    this.title.setTitle(fullTitle);
    this.setName('description', description);
    this.setProperty('og:title', fullTitle);
    this.setProperty('og:description', description);
    this.setProperty('og:url', url);
    this.setProperty('og:type', type);
    this.setProperty('og:site_name', site.name);
    this.setProperty('og:image', new URL('/og-image.png', site.url).href);
    this.setName('twitter:card', 'summary_large_image');
    this.setCanonical(url);
  }

  /** Adds or replaces one JSON-LD block (not executable, so no CSP hash needed). */
  setJsonLd(id: string, data: object): void {
    const selector = `script[type="application/ld+json"][data-ld="${id}"]`;
    let script = this.document.head.querySelector(selector);
    if (!script) {
      script = this.document.createElement('script');
      script.setAttribute('type', 'application/ld+json');
      script.setAttribute('data-ld', id);
      this.document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data);
  }

  removeJsonLd(id: string): void {
    this.document.head
      .querySelector(`script[type="application/ld+json"][data-ld="${id}"]`)
      ?.remove();
  }

  private setName(name: string, content: string): void {
    this.meta.updateTag({ name, content });
  }

  private setProperty(property: string, content: string): void {
    this.meta.updateTag({ property, content });
  }

  private setCanonical(href: string): void {
    let link = this.document.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  }
}

/** schema.org Person for the home page. */
export function personJsonLd(): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.role,
    url: site.url,
    email: `mailto:${profile.email}`,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Tunis',
      addressCountry: 'TN',
    },
    sameAs: [profile.linkedin, profile.github],
    knowsAbout: [
      'Angular',
      'TypeScript',
      'Nx',
      'Micro-frontends',
      'Three.js',
      'NestJS',
      'n8n',
    ],
  };
}
