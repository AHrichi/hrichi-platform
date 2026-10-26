import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AhButton } from './button';

@Component({
  imports: [AhButton],
  template: `
    <a ahButton href="/cv">CV</a>
    <button ahButton="secondary" size="sm" type="button">Email</button>
  `,
})
class Host {}

describe('AhButton', () => {
  it('applies the variant and size classes to links and buttons', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const [link, button] = fixture.nativeElement.querySelectorAll(
      '.ah-button',
    ) as NodeListOf<HTMLElement>;

    expect(link.className).toContain('ah-button--primary');
    expect(button.className).toContain('ah-button--secondary');
    expect(button.className).toContain('ah-button--sm');
  });
});
