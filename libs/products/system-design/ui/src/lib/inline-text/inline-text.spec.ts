import { TestBed } from '@angular/core/testing';
import { SdInlineText } from './inline-text';

describe('SdInlineText', () => {
  it('renders bold, code, emphasis and plain spans via textContent without innerHTML', async () => {
    const fixture = TestBed.createComponent(SdInlineText);
    fixture.componentRef.setInput(
      'text',
      'A **cache** answers `GET /user` with low _latency_ <script>nope</script>.',
    );
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('strong')?.textContent).toBe('cache');
    expect(host.querySelector('code')?.textContent).toBe('GET /user');
    expect(host.querySelector('em')?.textContent).toBe('latency');
    expect(host.querySelector('script')).toBeNull();
    expect(host.textContent).toContain('<script>nope</script>');
  });
});
