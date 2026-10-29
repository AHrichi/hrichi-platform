import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { StudyLmStore } from '../../store/studylm.store';
import type { N8nConnectionMode } from '@ah/products/studylm/domain';

interface N8nFormModel {
  mode: N8nConnectionMode;
  localUrl: string;
  tunnelUrl: string;
  customUrl: string;
}

@Component({
  selector: 'ah-n8n-settings-modal',
  imports: [FormField, FormRoot],
  templateUrl: './n8n-settings-modal.component.html',
  styleUrl: './n8n-settings-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class N8nSettingsModalComponent {
  readonly store = inject(StudyLmStore);

  readonly model = signal<N8nFormModel>({
    mode: this.store.n8nConfig().mode,
    localUrl: this.store.n8nConfig().localUrl,
    tunnelUrl: this.store.n8nConfig().tunnelUrl,
    customUrl: this.store.n8nConfig().customUrl,
  });

  readonly n8nForm = form(this.model, (path) => {
    required(path.localUrl, { message: 'Local n8n URL is required' });
  });

  setMode(mode: N8nConnectionMode) {
    this.model.update((m) => ({ ...m, mode }));
    this.store.updateN8nConfig({ mode });
  }

  saveSettings() {
    const val = this.model();
    this.store.updateN8nConfig({
      mode: val.mode,
      localUrl: val.localUrl,
      tunnelUrl: val.tunnelUrl,
      customUrl: val.customUrl,
    });
    this.store.testN8nConnection();
    this.store.toggleSettingsModal(false);
  }

  close() {
    this.store.toggleSettingsModal(false);
  }
}
