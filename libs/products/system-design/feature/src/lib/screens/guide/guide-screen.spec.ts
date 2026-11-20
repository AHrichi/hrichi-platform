import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { GuideScreen } from './guide-screen';

describe('GuideScreen', () => {
  it('renders guide sections, keyboard shortcut reference and back link', async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    const fixture = TestBed.createComponent(GuideScreen);
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('h1')?.textContent).toContain(
      'How the System Design course works',
    );
    expect(host.querySelectorAll('.guide-card').length).toBe(4);
    expect(host.querySelectorAll('.shortcut-row').length).toBe(6);
  });
});
