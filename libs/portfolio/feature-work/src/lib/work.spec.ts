import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CaseStudyPage } from './case-study-page';
import { WorkListPage } from './work-list-page';

beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection(), provideRouter([])],
  });
});

describe('WorkListPage', () => {
  it('links every case study', async () => {
    const fixture = TestBed.createComponent(WorkListPage);
    await fixture.whenStable();
    const links = Array.from<HTMLAnchorElement>(
      fixture.nativeElement.querySelectorAll('ah-link-card a'),
    ).map((a) => a.getAttribute('href'));

    expect(links).toContain('/work/this-platform');
    expect(links.length).toBe(4);
  });
});

describe('CaseStudyPage', () => {
  it('renders the case study for the slug, with its decisions', async () => {
    const fixture = TestBed.createComponent(CaseStudyPage);
    fixture.componentRef.setInput('slug', 'schema-driven-integrations');
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toBe(
      'A plug-and-play integration platform',
    );
    expect(element.querySelectorAll('.decisions > li').length).toBe(2);
    expect(document.title).toBe(
      'A plug-and-play integration platform · Ahmed Hrichi',
    );
  });

  it('shows a not-found message for an unknown slug', async () => {
    const fixture = TestBed.createComponent(CaseStudyPage);
    fixture.componentRef.setInput('slug', 'does-not-exist');
    await fixture.whenStable();

    expect(fixture.nativeElement.querySelector('h1')?.textContent).toBe(
      'Case study not found',
    );
  });
});
