import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AhButton,
  AhTooltip,
  Badge,
  Modal,
  ProgressBar,
} from '@ah/ui';
import {
  Chapter,
  DayTypeSelection,
  MissedGoalReason,
  parseChapterOutline,
  PERMANENT_PHONE_ALARMS,
  TodayCompletionStatus,
} from '@ah/products/alarm-engine/domain';
import { AlarmEngineStore } from '../alarm-engine.store';
import type { AlarmLanguage } from '../i18n';

@Component({
  selector: 'ah-alarm-engine-shell',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AhButton,
    AhTooltip,
    Badge,
    ProgressBar,
    Modal,
  ],
  providers: [AlarmEngineStore],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './alarm-engine-shell.component.html',
  styleUrl: './alarm-engine-shell.component.scss',
})
export class AlarmEngineShellComponent {
  readonly store = inject(AlarmEngineStore);

  readonly permanentAlarms = PERMANENT_PHONE_ALARMS;

  // Modals & form signals
  readonly backupJsonText = signal<string>('');
  readonly newTopicName = signal<string>('');
  readonly newTopicDesc = signal<string>('');
  readonly newTopicColor = signal<string>('#6366f1');
  readonly newTopicSyllabus = signal<string>('');
  readonly newTopicImportMode = signal<'queue' | 'backfill'>('queue');
  readonly docExtractionPrompt = signal<string>('');
  readonly parsedOutlineCount = computed(() => {
    return parseChapterOutline(this.newTopicSyllabus()).length;
  });

  readonly languages: readonly { id: AlarmLanguage; label: string; flag: string }[] = [
    { id: 'en', label: 'English', flag: '🇬🇧' },
    { id: 'fr', label: 'Français', flag: '🇫🇷' },
    { id: 'ar', label: 'العربية', flag: '🇲🇦' },
  ];

  readonly navTabs = computed(() => [
    {
      id: 'decision' as const,
      label: this.store.dict().nav.decision,
      shortLabel: this.store.dict().nav.decisionShort,
      icon: '🌙',
    },
    {
      id: 'tracker' as const,
      label: this.store.dict().nav.tracker,
      shortLabel: this.store.dict().nav.trackerShort,
      icon: '📊',
    },
    {
      id: 'guide' as const,
      label: this.store.dict().nav.guide,
      shortLabel: this.store.dict().nav.guideShort,
      icon: '📖',
    },
    {
      id: 'reference' as const,
      label: this.store.dict().nav.reference,
      shortLabel: this.store.dict().nav.referenceShort,
      icon: '⏰',
    },
  ]);

  readonly completionOptions = computed<
    readonly { value: TodayCompletionStatus; label: string; icon: string }[]
  >(() => [
    { value: 'YES', label: this.store.dict().questionnaire.optFinished, icon: '✅' },
    { value: 'NO', label: this.store.dict().questionnaire.optRepeat, icon: '🔁' },
    {
      value: 'CONSOLIDATION_COMPLETED_TODAY',
      label: this.store.dict().questionnaire.optConsolidation,
      icon: '🎯',
    },
    {
      value: 'MISSED_GOALS',
      label: this.store.dict().questionnaire.optMissed,
      icon: '🌿',
    },
  ]);

  readonly missedReasonOptions = computed<
    readonly { value: MissedGoalReason; label: string; icon: string }[]
  >(() => [
    {
      value: 'OFF_TRACK',
      label: this.store.dict().questionnaire.missedReasonOffTrack,
      icon: '🎯',
    },
    {
      value: 'OVERWHELMED',
      label: this.store.dict().questionnaire.missedReasonOverwhelmed,
      icon: '🛡️',
    },
    {
      value: 'EMERGENCY',
      label: this.store.dict().questionnaire.missedReasonEmergency,
      icon: '🌿',
    },
  ]);

  readonly codingOptions = computed(() => [
    { value: 'CLEAN' as const, label: this.store.dict().questionnaire.codingClean, icon: '✨' },
    {
      value: 'CARRYOVER' as const,
      label: this.store.dict().questionnaire.codingCarryover,
      icon: '⏳',
    },
  ]);

  readonly dayTypeOptions = computed<
    readonly { value: DayTypeSelection; label: string; icon: string }[]
  >(() => [
    { value: 'Auto-Detect', label: 'Auto-Detect', icon: '🤖' },
    { value: 'Standard', label: 'Standard', icon: '⚡' },
    { value: 'Fasting', label: 'Fasting', icon: '🍃' },
    { value: 'Recovery', label: 'Recovery', icon: '🌿' },
    { value: 'Consolidation', label: 'Consolidation', icon: '🎯' },
  ]);

  // Topic creation & edit modal
  openNewTopicModal(): void {
    this.newTopicName.set('');
    this.newTopicDesc.set('');
    this.newTopicColor.set('#6366f1');
    this.newTopicSyllabus.set('');
    this.newTopicImportMode.set('queue');
    this.docExtractionPrompt.set('');
    this.store.docParseError.set(null);
    this.store.openCreateTopicModal();
  }

  openEditTopicModal(topicId?: string): void {
    const id = topicId || this.store.selectedTopicId();
    const found = this.store.topics().find((t) => t.id === id);
    if (found) {
      this.newTopicName.set(found.name);
      this.newTopicDesc.set(found.description || '');
      this.newTopicColor.set(found.color || '#6366f1');
      this.newTopicSyllabus.set('');
      this.newTopicImportMode.set('queue');
      this.docExtractionPrompt.set('');
      this.store.docParseError.set(null);
      this.store.openEditTopicModal(found.id);
    }
  }

  submitTopicModal(): void {
    const name = this.newTopicName().trim();
    if (!name) return;
    const editing = this.store.editingTopic();
    this.store.saveTopicAndSyllabus({
      id: editing?.id,
      name,
      description: this.newTopicDesc(),
      color: this.newTopicColor(),
      rawSyllabus: this.newTopicSyllabus(),
      importMode: this.newTopicImportMode(),
    });
  }

  readonly showN8nSettings = signal<boolean>(false);
  readonly isDocDragOver = signal<boolean>(false);
  readonly parsingFileName = signal<string | null>(null);

  toggleN8nSettings(): void {
    this.showN8nSettings.update((v) => !v);
  }

  async handleDocFileSelect(event: Event): Promise<void> {
    if (this.store.isParsingDoc()) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    await this.processUploadedDoc(file);
    input.value = '';
  }

  async handleDocDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    this.isDocDragOver.set(false);
    if (this.store.isParsingDoc()) return;
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      await this.processUploadedDoc(file);
    }
  }

  onDocDragOver(event: DragEvent): void {
    event.preventDefault();
    if (!this.store.isParsingDoc()) {
      this.isDocDragOver.set(true);
    }
  }

  onDocDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDocDragOver.set(false);
  }

  private async processUploadedDoc(file: File): Promise<void> {
    if (this.store.isParsingDoc()) return;
    this.parsingFileName.set(file.name);
    try {
      const res = await this.store.parseDocumentFile(file, this.docExtractionPrompt());
      if (res.success) {
        if (res.topicName && (!this.newTopicName() || this.newTopicName() === '')) {
          this.newTopicName.set(res.topicName);
        }
        if (res.topicDescription && (!this.newTopicDesc() || this.newTopicDesc() === '')) {
          this.newTopicDesc.set(res.topicDescription);
        }
        if (res.outlineText) {
          const current = this.newTopicSyllabus().trim();
          this.newTopicSyllabus.set(
            current ? `${current}\n${res.outlineText}` : res.outlineText,
          );
        }
      }
    } finally {
      this.parsingFileName.set(null);
    }
  }

  copyScheduleAsText(): void {
    const d = this.store.decision();
    const lines = [
      `📅 Schedule for ${d.tomorrowDate} (${d.effectiveDayType} Protocol)`,
      `Target: Ch. ${d.targetChapter} ${d.isRepeat ? '(REPEAT)' : ''}`,
      '',
      ...d.alarms.map((a) => `⏰ ${a.time} - ${a.title}\n   ${a.description}`),
    ];
    const text = lines.join('\n');
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      this.store.showToast('Copied full text schedule to clipboard!');
    }
  }

  // Backup modal
  openBackupModal(): void {
    this.backupJsonText.set(
      JSON.stringify(
        {
          chapters: this.store.chapters(),
          systemState: this.store.systemState(),
          questionnaire: this.store.questionnaire(),
        },
        null,
        2,
      ),
    );
    this.store.isBackupModalOpen.set(true);
  }

  handleImportJson(): void {
    const text = this.backupJsonText().trim();
    if (text) {
      this.store.importJson(text);
    }
  }

  handleFileUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        if (content) {
          this.backupJsonText.set(content);
          this.store.importJson(content);
        }
      };
      reader.readAsText(file);
    }
  }

  // Study date change handler to auto-fill D-3, D-7, D-14
  handleStudyDateInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input && input.value) {
      this.store.onModalStudyDateChanged(input.value);
    }
  }

  isReviewDue(
    ch: Chapter,
    type: 'D-3' | 'D-7' | 'D-14',
    asOfDate: string,
  ): boolean {
    const completed =
      type === 'D-3'
        ? ch.d3Completed
        : type === 'D-7'
          ? ch.d7Completed
          : ch.d14Completed;
    if (completed) return false;
    const date =
      type === 'D-3' ? ch.d3Date : type === 'D-7' ? ch.d7Date : ch.d14Date;
    return date.localeCompare(asOfDate) <= 0;
  }
}
