import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Badge } from '../badge/badge';
import { AhButton } from '../button/button';

/**
 * Accessible, token-themed drag-and-drop & file-picker upload zone.
 * Supports keyboard activation, format badges, loading states, and custom actions.
 */
@Component({
  selector: 'ah-file-dropzone',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [Badge, AhButton],
  host: {
    class: 'ah-file-dropzone',
    '[class.ah-file-dropzone--dragging]': 'isDragging()',
    '[class.ah-file-dropzone--loading]': 'loading()',
    '[class.ah-file-dropzone--disabled]': 'disabled()',
    '(dragover)': 'onDragOver($event)',
    '(dragleave)': 'onDragLeave($event)',
    '(drop)': 'onDrop($event)',
  },
  templateUrl: './file-dropzone.html',
  styleUrl: './file-dropzone.scss',
})
export class FileDropzone {
  readonly title = input.required<string>();
  readonly description = input<string>();
  readonly accept = input<string>('.txt,.zip');
  readonly multiple = input<boolean>(false);
  readonly icon = input<string>('📦');
  readonly loadingIcon = input<string>('⏳');
  readonly ctaLabel = input<string>('Select File');
  readonly loadingLabel = input<string>('Processing file...');
  readonly badges = input<readonly string[]>([]);
  readonly loading = input<boolean>(false);
  readonly disabled = input<boolean>(false);

  readonly fileSelected = output<File>();
  readonly filesSelected = output<readonly File[]>();

  protected readonly isDragging = signal<boolean>(false);
  private readonly fileInputRef =
    viewChild<ElementRef<HTMLInputElement>>('fileInput');

  openFileDialog(): void {
    if (this.disabled() || this.loading()) return;
    this.fileInputRef()?.nativeElement.click();
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled() && !this.loading()) {
      this.isDragging.set(true);
    }
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    if (this.disabled() || this.loading()) return;

    const items = event.dataTransfer?.items;
    if (items && items.length > 0) {
      const entries: FileSystemEntry[] = [];
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry?.();
        if (entry) {
          entries.push(entry);
        }
      }
      if (entries.some((e) => e.isDirectory)) {
        void this.extractEntriesRecursively(entries).then((extractedFiles) => {
          if (extractedFiles.length > 0) {
            this.fileSelected.emit(extractedFiles[0]);
            this.filesSelected.emit(extractedFiles);
          }
        });
        return;
      }
    }

    const fileList = event.dataTransfer?.files;
    if (fileList && fileList.length > 0) {
      const files = Array.from(fileList);
      this.fileSelected.emit(files[0]);
      this.filesSelected.emit(files);
    }
  }

  private async extractEntriesRecursively(
    entries: readonly FileSystemEntry[],
  ): Promise<File[]> {
    const collected: File[] = [];
    const readEntry = async (entry: FileSystemEntry): Promise<void> => {
      if (entry.isFile) {
        const fileEntry = entry as FileSystemFileEntry;
        const file = await new Promise<File | null>((resolve) => {
          fileEntry.file(
            (f) => resolve(f),
            () => resolve(null),
          );
        });
        if (file) {
          collected.push(file);
        }
      } else if (entry.isDirectory) {
        const dirEntry = entry as FileSystemDirectoryEntry;
        const reader = dirEntry.createReader();
        const readAllBatches = async (): Promise<FileSystemEntry[]> => {
          const all: FileSystemEntry[] = [];
          while (true) {
            const batch = await new Promise<FileSystemEntry[]>((resolve) => {
              reader.readEntries(
                (res) => resolve(res),
                () => resolve([]),
              );
            });
            if (batch.length === 0) break;
            all.push(...batch);
          }
          return all;
        };
        const children = await readAllBatches();
        for (const child of children) {
          await readEntry(child);
        }
      }
    };

    for (const entry of entries) {
      await readEntry(entry);
    }
    return collected;
  }

  protected onInputChange(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const fileList = inputEl.files;
    if (fileList && fileList.length > 0) {
      const files = Array.from(fileList);
      this.fileSelected.emit(files[0]);
      this.filesSelected.emit(files);
      inputEl.value = '';
    }
  }
}
