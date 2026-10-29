import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { AhAlert, AhButton, AhCodeBlock, AhModal } from '@ah/ui';
import { StudyLmStore } from '../../store/studylm.store';
import type { StudyLmJsonImport } from '@ah/products/studylm/domain';

interface JsonImportFormModel {
  jsonText: string;
}

const SAMPLE_SCHEMA = `{
  "subject": "Modern Angular Architecture",
  "domain": "frontend-web",
  "flashcards": [
    {
      "tier": "beginner",
      "front": "What is zoneless change detection in Angular?",
      "back": "A runtime model where Angular relies on signals and component notifications rather than monkey-patching async APIs with Zone.js.",
      "codeSnippet": "bootstrapApplication(AppComponent, {\\n  providers: [provideZonelessChangeDetection()]\\n});",
      "codeLanguage": "typescript",
      "category": "Change Detection",
      "sourceCitation": "Angular.dev Docs"
    }
  ],
  "quiz": [
    {
      "tier": "intermediate",
      "question": "Which signal function creates a memoized derived value in Angular?",
      "options": ["computed()", "effect()", "signal()", "untracked()"],
      "correctIndex": 0,
      "explanation": "computed() declares a memoized, reactive derived state that only re-evaluates when tracked dependencies change.",
      "sourceCitation": "Angular Signals Reference"
    }
  ]
}`;

@Component({
  selector: 'ah-json-import-modal',
  standalone: true,
  imports: [CommonModule, FormField, FormRoot, AhModal, AhButton, AhAlert],
  templateUrl: './json-import-modal.component.html',
  styleUrl: './json-import-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonImportModalComponent {
  readonly store = inject(StudyLmStore);
  readonly sampleSchema = SAMPLE_SCHEMA;

  readonly model = signal<JsonImportFormModel>({
    jsonText: '',
  });

  readonly errorStatus = signal<string | null>(null);

  readonly importForm = form(this.model, (path) => {
    required(path.jsonText, { message: 'JSON payload is required' });
  });

  loadSample(): void {
    this.model.set({ jsonText: SAMPLE_SCHEMA });
    this.errorStatus.set(null);
  }

  handleFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        this.model.set({ jsonText: reader.result });
        this.errorStatus.set(null);
      }
    };
    reader.readAsText(file);
  }

  submitImport(): void {
    const jsonStr = this.model().jsonText.trim();
    if (!jsonStr) {
      this.errorStatus.set('Please provide JSON text or upload a file.');
      return;
    }

    try {
      const parsed = JSON.parse(jsonStr) as StudyLmJsonImport;
      this.store.importFromJson(parsed);
      this.errorStatus.set(null);
      this.close();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Invalid JSON format';
      this.errorStatus.set(`JSON Parse Error: ${msg}`);
    }
  }

  close(): void {
    this.store.setShowJsonImportModal(false);
  }
}
