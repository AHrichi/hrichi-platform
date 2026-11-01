import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { FileDropzone } from './file-dropzone';

@Component({
  imports: [FileDropzone],
  template: `
    <ah-file-dropzone
      title="Drop WhatsApp Export Here"
      description="Supports .zip and .txt files"
      [badges]="['.ZIP Archive', '.TXT Export']"
      ctaLabel="Choose Export"
    />
  `,
})
class Host {}

describe('FileDropzone', () => {
  it('renders title, description, badges, and CTA button', async () => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    const title = fixture.nativeElement.querySelector(
      '.ah-file-dropzone__title',
    );
    expect(title.textContent).toBe('Drop WhatsApp Export Here');

    const badges = fixture.nativeElement.querySelectorAll('ah-badge');
    expect(badges.length).toBe(2);
  });
});
