import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, FormField, FormRoot, required } from '@angular/forms/signals';
import { AhAlert, AhBadge, AhButton, AhModal, AhSegmentedControl } from '@ah/ui';
import { StudyLmStore } from '../../store/studylm.store';
import { StudyLmApiService } from '../../services/studylm-api.service';
import type { N8nConnectionMode } from '@ah/products/studylm/domain';

interface N8nFormModel {
  mode: N8nConnectionMode;
  localUrl: string;
  tunnelUrl: string;
  customUrl: string;
}

@Component({
  selector: 'ah-n8n-settings-modal',
  standalone: true,
  imports: [CommonModule, FormField, FormRoot, AhModal, AhButton, AhBadge, AhAlert, AhSegmentedControl],
  templateUrl: './n8n-settings-modal.component.html',
  styleUrl: './n8n-settings-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class N8nSettingsModalComponent {
  readonly store = inject(StudyLmStore);
  private readonly apiService = inject(StudyLmApiService);

  readonly modeOptions: { label: string; value: N8nConnectionMode }[] = [
    { label: 'Cloud Tunnel (ngrok)', value: 'tunnel' },
    { label: 'Localhost (Docker)', value: 'local' },
    { label: 'Custom Webhook', value: 'custom' },
  ];

  readonly model = signal<N8nFormModel>({
    mode: this.store.n8nConfig().mode,
    localUrl: this.store.n8nConfig().localUrl,
    tunnelUrl: this.store.n8nConfig().tunnelUrl,
    customUrl: this.store.n8nConfig().customUrl,
  });

  readonly isTesting = signal<boolean>(false);
  readonly testFeedback = signal<{ ok: boolean; message: string } | null>(null);

  readonly n8nForm = form(this.model, (path) => {
    required(path.localUrl, { message: 'Local URL is required' });
  });

  setMode(mode: N8nConnectionMode): void {
    this.model.update((m) => ({ ...m, mode }));
  }

  async testConnection(): Promise<void> {
    this.isTesting.set(true);
    this.testFeedback.set(null);

    const val = this.model();
    const endpoint =
      val.mode === 'local'
        ? val.localUrl
        : val.mode === 'custom'
          ? val.customUrl
          : val.tunnelUrl;

    const res = await this.apiService.testConnection(endpoint);
    this.isTesting.set(false);

    if (res.ok) {
      this.testFeedback.set({
        ok: true,
        message: `Connected successfully (${res.latencyMs}ms). Active AI: ${res.providers?.join(', ') || 'Groq LPU'}`,
      });
      this.store.updateN8nConfig({
        isConnected: true,
        lastPingMs: res.latencyMs,
        lastError: undefined,
      });
    } else {
      this.testFeedback.set({
        ok: false,
        message: res.error || 'Connection failed',
      });
      this.store.updateN8nConfig({
        isConnected: false,
        lastError: res.error,
      });
    }
  }

  saveSettings(): void {
    const val = this.model();
    const activeEndpoint =
      val.mode === 'local'
        ? val.localUrl
        : val.mode === 'custom'
          ? val.customUrl
          : val.tunnelUrl;

    this.store.updateN8nConfig({
      mode: val.mode,
      localUrl: val.localUrl,
      tunnelUrl: val.tunnelUrl,
      customUrl: val.customUrl,
      activeEndpoint,
    });

    void this.testConnection();
    this.close();
  }

  close(): void {
    this.store.setShowSettingsModal(false);
  }
}
