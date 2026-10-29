import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { CodeBlock } from './code-block';

@Component({
  imports: [CodeBlock],
  template: `
    <ah-code-block
      code="const a = 1;"
      language="typescript"
      filename="test.ts"
    />
  `,
})
class Host {}

describe('CodeBlock', () => {
  it('renders filename, language and code content', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const filename = fixture.nativeElement.querySelector('.ah-code-filename');
    const lang = fixture.nativeElement.querySelector('.ah-code-lang');
    const code = fixture.nativeElement.querySelector('code');

    expect(filename.textContent).toContain('test.ts');
    expect(lang.textContent).toContain('typescript');
    expect(code.textContent).toContain('const a = 1;');
  });
});
