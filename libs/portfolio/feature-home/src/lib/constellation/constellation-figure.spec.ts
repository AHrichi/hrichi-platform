import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PreferencesStore } from '@ah/shared/state';
import { ConstellationFigure } from './constellation-figure';

describe('ConstellationFigure', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ConstellationFigure],
      providers: [provideZonelessChangeDetection(), provideRouter([])],
    });
  });

  it('renders the 3D scene stage with controls and summary', async () => {
    const fixture = TestBed.createComponent(ConstellationFigure);
    await fixture.whenStable();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('ah-scene')).not.toBeNull();
    expect(element.textContent).toContain("This site's real Nx graph:");
    expect(element.textContent).toContain('Spin 360°');
    expect(element.textContent).toContain('+ Add Part');
  });

  it('adds a dynamic module and increments project count on addPart()', async () => {
    const fixture = TestBed.createComponent(ConstellationFigure);
    const comp = fixture.componentInstance;
    await fixture.whenStable();

    const initialCount = comp['projectCount']();
    comp['addPart']();
    await fixture.whenStable();

    expect(comp['projectCount']()).toBe(initialCount + 1);
    expect(comp['statusNotice']()).toContain('Added');
  });

  it('removes a module on removePart()', async () => {
    const fixture = TestBed.createComponent(ConstellationFigure);
    const comp = fixture.componentInstance;
    await fixture.whenStable();

    const initialCount = comp['projectCount']();
    comp['addPart']();
    await fixture.whenStable();
    expect(comp['projectCount']()).toBe(initialCount + 1);

    comp['removePart']();
    await fixture.whenStable();
    expect(comp['projectCount']()).toBe(initialCount);
    expect(comp['statusNotice']()).toContain('Removed');
  });

  it('triggers 360 spin on fullSpin()', async () => {
    const fixture = TestBed.createComponent(ConstellationFigure);
    const comp = fixture.componentInstance;
    await fixture.whenStable();

    expect(comp['spinCount']()).toBe(0);
    comp['fullSpin']();
    expect(comp['spinCount']()).toBe(1);
  });

  it('filters by kind and resets on resetGraph()', async () => {
    const fixture = TestBed.createComponent(ConstellationFigure);
    const comp = fixture.componentInstance;
    await fixture.whenStable();

    const initialCount = comp['projectCount']();
    comp['setFilterKind']('app');
    await fixture.whenStable();

    expect(comp['projectCount']()).toBeLessThan(initialCount);

    comp['resetGraph']();
    await fixture.whenStable();
    expect(comp['projectCount']()).toBe(initialCount);
    expect(comp['selectedKind']()).toBe('all');
  });

  it('reactively renders Italian and German controls', async () => {
    const preferences = TestBed.inject(PreferencesStore);
    const fixture = TestBed.createComponent(ConstellationFigure);

    preferences.setLanguage('it');
    await fixture.whenStable();
    let text = fixture.nativeElement.textContent;
    expect(text).toContain('Rotazione 360°');
    expect(text).toContain('+ Aggiungi modulo');

    preferences.setLanguage('de');
    await fixture.whenStable();
    text = fixture.nativeElement.textContent;
    expect(text).toContain('360°-Drehung');
    expect(text).toContain('+ Modul hinzufügen');
  });
});
