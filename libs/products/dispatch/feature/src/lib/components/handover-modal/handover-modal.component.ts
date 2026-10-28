import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DispatchStore } from '../../store/dispatch.store';
import { generateHandoverWhatsAppText } from '@ah/products/dispatch/domain';

@Component({
  selector: 'ah-handover-modal',
  imports: [CommonModule],
  templateUrl: './handover-modal.component.html',
  styleUrl: './handover-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HandoverModalComponent {
  readonly store = inject(DispatchStore);
  readonly report = this.store.handoverReport;
  readonly copiedText = signal(false);

  copyWhatsAppText(): void {
    const text = generateHandoverWhatsAppText(this.report());
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text).catch(() => void 0);
    }
    this.copiedText.set(true);
    setTimeout(() => this.copiedText.set(false), 3000);
  }

  downloadReport(): void {
    const text = generateHandoverWhatsAppText(this.report());
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `PulseOps_Shift_Handover_${this.report().shift}_28Oct2026.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }
}
