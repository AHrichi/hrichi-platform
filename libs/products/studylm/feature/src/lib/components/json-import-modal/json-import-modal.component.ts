import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { StudyLmStore } from '../../store/studylm.store';

interface JsonImportFormModel {
  jsonText: string;
}

const SAMPLE_SCHEMA = `{
  "subject": "Modern Angular Architecture",
  "flashcards": [
    {
      "tier": "beginner",
      "front": "What is zoneless change detection in Angular?",
      "back": "A runtime model where Angular relies on signals and component notifications rather than monkey-patching async APIs with Zone.js.",
      "category": "Change Detection",
      "sourceCitation": "Angular v19 Docs"
    }
  ],
  "quiz": [
    {
      "tier": "intermediate",
      "question": "Which decorator/function is replaced by input() in modern Angular?",
      "options": ["@Input()", "@Output()", "@ViewChild()", "@Inject()"],
      "correctIndex": 0,
      "explanation": "input() signal function is the modern replacement for @Input() property decorator.",
      "sourceCitation": "Signals Overview"
    }
  ]
}`;

@Component({
  selector: 'ah-json-import-modal',
  imports: [FormField, FormRoot],
  templateUrl: './json-import-modal.component.html',
  styleUrl: './json-import-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JsonImportModalComponent {
  readonly store = inject(StudyLmStore);

  readonly model = signal<JsonImportFormModel>({
    jsonText: '',
  });

  readonly errorStatus = signal<string | null>(null);

  readonly importForm = form(this.model, (path) => {
    required(path.jsonText, { message: 'JSON payload is required' });
  });

  loadSample() {
    this.model.set({ jsonText: SAMPLE_SCHEMA });
    this.errorStatus.set(null);
  }

  handleFileUpload(event: Event) {
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

  submitImport() {
    const jsonStr = this.model().jsonText.trim();
    if (!jsonStr) {
      this.errorStatus.set('Please provide JSON text or upload a file.');
      return;
    }

    const result = this.store.importFromJson(jsonStr);
    if (!result.success) {
      this.errorStatus.set(result.message);
    } else {
      this.errorStatus.set(null);
    }
  }

  close() {
    this.store.toggleJsonImportModal(false);
  }
}
