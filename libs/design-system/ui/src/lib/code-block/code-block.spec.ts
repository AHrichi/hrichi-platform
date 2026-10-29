import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CodeBlock } from './code-block';

@Component({
  imports: [CodeBlock],
  template: `
    <ah-code-block
      [code]="code"
      language="typescript"
      filename="test.ts"
      caption="Example test caption"
    />
  `,
})
class Host {
  code = 'const count: number = 42;\n// comment\nreturn count;';
}

describe('CodeBlock', () => {
  it('renders filename, language, line count and syntax tokens', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const filename = fixture.nativeElement.querySelector('.ah-code-filename');
    const lang = fixture.nativeElement.querySelector('.ah-code-lang');
    const lines = fixture.nativeElement.querySelectorAll('.ah-code-line');
    const keywordToken = fixture.nativeElement.querySelector('.token-keyword');
    const commentToken = fixture.nativeElement.querySelector('.token-comment');
    const caption = fixture.nativeElement.querySelector('.ah-code-caption');

    expect(filename.textContent).toContain('test.ts');
    expect(lang.textContent).toContain('typescript');
    expect(lines.length).toBe(3);
    expect(keywordToken.textContent).toBe('const');
    expect(commentToken.textContent).toContain('// comment');
    expect(caption.textContent).toContain('Example test caption');
  });

  it('toggles line numbers and wrapping interactively', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const lineNumsBefore = fixture.nativeElement.querySelectorAll(
      '.ah-code-line-number'
    );
    expect(lineNumsBefore.length).toBe(3);

    // Toggle line numbers button
    const actionBtns = fixture.nativeElement.querySelectorAll(
      '.ah-code-action-btn'
    );
    const wrapBtn = actionBtns[0];
    const numToggleBtn = actionBtns[1];

    numToggleBtn.click();
    await fixture.whenStable();

    const lineNumsAfter = fixture.nativeElement.querySelectorAll(
      '.ah-code-line-number'
    );
    expect(lineNumsAfter.length).toBe(0);

    // Toggle wrapping
    expect(
      fixture.nativeElement.querySelector('.ah-code-body--wrapped')
    ).toBeNull();
    wrapBtn.click();
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('.ah-code-body--wrapped')
    ).not.toBeNull();
  });
});
