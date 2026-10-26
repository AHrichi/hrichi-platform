import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HelloLab } from './hello-lab';

describe('HelloLab', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HelloLab],
      providers: [provideZonelessChangeDetection()],
    });
  });

  it('updates the view through signals without zone.js', async () => {
    const fixture = TestBed.createComponent(HelloLab);
    await fixture.whenStable();
    const element = fixture.nativeElement as HTMLElement;
    const button = element.querySelector('button') as HTMLButtonElement;

    button.click();
    button.click();
    await fixture.whenStable();

    expect(button.textContent).toContain('Clicked 2 times');
    expect(element.querySelector('.derived')?.textContent).toContain('4');
  });
});
