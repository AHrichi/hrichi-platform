// src/app/exercises/bulk-operations/bulk-operations.component.ts
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, forkJoin, from, of } from 'rxjs';
import { bufferCount, concatMap, tap, finalize, toArray } from 'rxjs/operators';
import { AhButton, SectionHeading, SegmentedOption, Tag } from '@ah/ui';
import {
  FileProcessingService,
  File,
} from '../../shared/services/file-processing.service';
import { NotificationService } from '../../shared/services/notification.service';
import { UseCaseFocusComponent } from '../../shared/ui/use-case-focus/use-case-focus.component';

interface FileItem extends File {
  status: 'pending' | 'processing' | 'done';
}

@Component({
  selector: 'app-bulk-operations',
  standalone: true,
  imports: [CommonModule, UseCaseFocusComponent, AhButton, Tag, SectionHeading],
  templateUrl: './bulk-operations.component.html',
  styleUrls: ['./bulk-operations.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BulkOperationsComponent {
  private fileService = inject(FileProcessingService);
  private notificationService = inject(NotificationService);

  // --- Focus View Options ---
  readonly focusOptions: readonly SegmentedOption<string>[] = [
    { value: 'all', label: 'All Bulk Operations' },
    { value: 'forkJoin', label: 'forkJoin (Parallel)' },
    { value: 'bufferCount', label: 'bufferCount (Batched)' },
  ];
  readonly activeCase = signal<string>('all');

  // --- Code Snippets & Visibility ---
  readonly showCode = signal<Record<string, boolean>>({
    forkJoin: false,
    bufferCount: false,
  });

  readonly codeSnippets = {
    forkJoin: `// ⚡ forkJoin: Parallel requests (like Promise.all)
// All streams must COMPLETE. Emits once with an array/dictionary of last values.
forkJoin({
  user: this.http.get<User>('/api/me'),
  roles: this.http.get<Role[]>('/api/roles'),
  features: this.http.get<FeatureFlag[]>('/api/flags')
}).subscribe(({ user, roles, features }) => {
  this.appState.initialize(user, roles, features);
});`,
    bufferCount: `// 📦 bufferCount: Controlled Chunking / Rate Limiting
// Avoid flooding backend API with 100 simultaneous requests.
// Process 5 items per batch in sequence using concatMap.
from(largeFileList).pipe(
  bufferCount(5),
  concatMap(batch => forkJoin(batch.map(file => this.upload(file))))
).subscribe(batchResults => {
  console.log('Batch completed:', batchResults);
});`,
  };

  toggleCode(key: string) {
    this.showCode.update((s) => ({ ...s, [key]: !s[key] }));
  }

  // --- Signals for UI Configuration ---
  fileCount = signal(6);
  batchSize = signal(3);

  // --- State for forkJoin ---
  forkJoinFiles = signal<FileItem[]>(this.createInitialFiles());
  forkJoinResults = signal<string[]>([]);
  isForkJoinProcessing = signal(false);

  // --- State for bufferCount ---
  bufferCountFiles = signal<FileItem[]>(this.createInitialFiles());
  bufferCountResults = signal<string[][]>([]);
  isBufferCountProcessing = signal(false);

  // --- forkJoin Example ---
  processAllWithForkJoin() {
    this.isForkJoinProcessing.set(true);
    this.forkJoinResults.set([]);
    this.forkJoinFiles.update((files) =>
      files.map((f) => ({ ...f, status: 'processing' })),
    );
    this.notificationService.show(
      'Starting all file processes in parallel...',
      'info',
    );

    const processingObservables = this.forkJoinFiles().map((file) =>
      this.fileService.processFile(file).pipe(
        tap(() => {
          this.forkJoinFiles.update((files) =>
            files.map((f) => (f.id === file.id ? { ...f, status: 'done' } : f)),
          );
        }),
      ),
    );

    forkJoin(processingObservables)
      .pipe(finalize(() => this.isForkJoinProcessing.set(false)))
      .subscribe((results) => {
        this.forkJoinResults.set(results);
        this.notificationService.show('All files processed!', 'success');
      });
  }

  // --- bufferCount Example ---
  processInBatches() {
    this.isBufferCountProcessing.set(true);
    this.bufferCountResults.set([]);
    this.notificationService.show(
      `Starting to process files in batches of ${this.batchSize()}...`,
      'info',
    );

    from(this.bufferCountFiles())
      .pipe(
        bufferCount(this.batchSize()),
        concatMap((batch) => {
          if (batch.length === 0) return of([]);

          this.notificationService.show(
            `Processing batch: ${batch.map((f) => f.name).join(', ')}`,
            'info',
          );

          batch.forEach((file) => {
            this.bufferCountFiles.update((files) =>
              files.map((f) =>
                f.id === file.id ? { ...f, status: 'processing' } : f,
              ),
            );
          });

          const batchObservables = batch.map((file) =>
            this.fileService.processFile(file).pipe(
              tap(() => {
                this.bufferCountFiles.update((files) =>
                  files.map((f) =>
                    f.id === file.id ? { ...f, status: 'done' } : f,
                  ),
                );
              }),
            ),
          );
          return forkJoin(batchObservables);
        }),
        toArray(),
        finalize(() => this.isBufferCountProcessing.set(false)),
      )
      .subscribe((batchedResults) => {
        this.bufferCountResults.set(batchedResults);
        this.notificationService.show('All batches processed!', 'success');
      });
  }

  reset(type: 'forkJoin' | 'bufferCount') {
    if (type === 'forkJoin') {
      this.forkJoinFiles.set(this.createInitialFiles());
      this.forkJoinResults.set([]);
      this.isForkJoinProcessing.set(false);
    } else {
      this.bufferCountFiles.set(this.createInitialFiles());
      this.bufferCountResults.set([]);
      this.isBufferCountProcessing.set(false);
    }
  }

  private createInitialFiles(): FileItem[] {
    return Array.from({ length: this.fileCount() }, (_, i) => ({
      id: i + 1,
      name: `document_${i + 1}.pdf`,
      status: 'pending',
    }));
  }

  // --- Input Handlers ---
  onFileCountChange(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    if (!isNaN(val) && val >= 1) {
      this.fileCount.set(val);
      this.reset('forkJoin');
      this.reset('bufferCount');
    }
  }

  onBatchSizeChange(event: Event) {
    const val = Number((event.target as HTMLInputElement).value);
    if (!isNaN(val) && val >= 1) {
      this.batchSize.set(val);
      this.reset('bufferCount');
    }
  }
}
