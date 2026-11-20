import { TestBed } from '@angular/core/testing';
import { ComingSoon } from './coming-soon';

describe('ComingSoon', () => {
  it('shows its heading and body', async () => {
    const fixture = TestBed.createComponent(ComingSoon);
    fixture.componentRef.setInput('heading', 'System Design');
    fixture.componentRef.setInput('body', 'Lessons are on their way.');
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('h1')?.textContent).toContain('System Design');
    expect(host.querySelector('p')?.textContent).toContain('on their way');
  });
});
