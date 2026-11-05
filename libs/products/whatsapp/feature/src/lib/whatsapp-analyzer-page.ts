import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AnalyticsBasisMode,
  DateOrderMode,
  formatBytesCompact,
  formatDurationCompact,
  ParticipantAnalytics,
  TimelinePoint,
} from '@ah/products/whatsapp/domain';
import { PreferencesStore } from '@ah/shared/state';
import {
  AhAlert,
  AhBadge,
  AhButton,
  AhCodeBlock,
  AhEmptyState,
  AhFileDropzone,
  AhHeatmapGrid,
  type AhHeatmapRowData,
  AhMetricCard,
  AhModal,
  AhPagination,
  AhProgressBar,
  AhSegmentedControl,
  AhSelect,
  type AhSelectOption,
  AhSplitBar,
  type AhSplitBarSegment,
  type AhTabItem,
  AhTabs,
  AhTag,
  AhTooltip,
  AhTruncatedText,
  type SegmentedOption,
} from '@ah/ui';
import { DEFAULT_LOCAL_WEBHOOK_URL } from './whatsapp-ai.service';
import {
  TranscriptTypeFilter,
  WhatsAppDashboardTab,
  WhatsAppStore,
} from './whatsapp.store';
import { WHATSAPP_COPY } from './i18n/whatsapp-copy';

@Component({
  selector: 'ah-whatsapp-analyzer-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AhAlert,
    AhBadge,
    AhButton,
    AhCodeBlock,
    AhEmptyState,
    AhFileDropzone,
    AhHeatmapGrid,
    AhMetricCard,
    AhModal,
    AhPagination,
    AhProgressBar,
    AhSegmentedControl,
    AhSelect,
    AhSplitBar,
    AhTabs,
    AhTag,
    AhTooltip,
    AhTruncatedText,
  ],
  templateUrl: './whatsapp-analyzer-page.html',
  styleUrl: './whatsapp-analyzer-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WhatsAppAnalyzerPageComponent {
  readonly store = inject(WhatsAppStore);
  readonly preferences = inject(PreferencesStore);
  readonly copy = computed(
    () => WHATSAPP_COPY[this.preferences.language()] ?? WHATSAPP_COPY.en,
  );

  readonly localPresetUrl = DEFAULT_LOCAL_WEBHOOK_URL;

  readonly stopwordInput = signal('');
  readonly stopwordError = signal<string | null>(null);
  readonly savedVoiceNoteKey = signal<string | null>(null);

  readonly webhookUrlError = computed<string | null>(() => {
    const raw = this.store.webhookSettings().webhookUrl.trim();
    if (!raw) {
      return 'Webhook POST URL is required.';
    }
    try {
      const parsed = new URL(raw);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        return 'URL must start with http:// or https://.';
      }
    } catch {
      return 'Please enter a valid HTTP/HTTPS URL (e.g. http://127.0.0.1:5678/... or https://...ngrok-free.dev/...)';
    }
    return null;
  });

  readonly authHeaderError = computed<string | null>(() => {
    const name = this.store.webhookSettings().authHeaderName.trim();
    const val = this.store.webhookSettings().authHeaderValue.trim();
    if (name && !val) {
      return 'Auth Header Value is required when a Header Name is provided.';
    }
    if (!name && val) {
      return 'Auth Header Name is required when a Header Value is provided.';
    }
    return null;
  });

  readonly hasSettingsErrors = computed<boolean>(() => {
    return Boolean(this.webhookUrlError() || this.authHeaderError());
  });

  // Pagination state signals
  readonly voiceNotesPage = signal(1);
  readonly voiceNotesPageSize = signal(8);
  readonly voiceNotesPageSizeOptions = [5, 8, 15, 30] as const;

  readonly mediaGalleryPage = signal(1);
  readonly mediaGalleryPageSize = signal(12);
  readonly mediaGalleryPageSizeOptions = [12, 24, 48] as const;

  readonly topWordsPage = signal(1);
  readonly topWordsPageSize = signal(15);
  readonly topWordsPageSizeOptions = [10, 15, 25, 50] as const;

  readonly topEmojisPage = signal(1);
  readonly topEmojisPageSize = signal(12);
  readonly topEmojisPageSizeOptions = [12, 18, 36] as const;

  readonly transcriptPage = signal(1);
  readonly transcriptPageSize = signal(30);
  readonly transcriptPageSizeOptions = [20, 30, 50, 100] as const;

  readonly dropzoneBadges = [
    '.ZIP Archive (Text + Audio/Video/Photo Analytics)',
    '🎙️ AI Voice Note Reader & Transcription',
    '.TXT Raw Export · iOS & Android',
  ] as const;

  readonly hoursHeader = Array.from({ length: 24 }, (_, h) =>
    String(h).padStart(2, '0'),
  );

  readonly dateModeOptions = computed<
    readonly SegmentedOption<DateOrderMode>[]
  >(() => {
    const resolved = this.store.report()?.dateDetection.resolvedOrder ?? 'DMY';
    return [
      { value: 'auto', label: `Auto (${resolved})` },
      { value: 'DMY', label: 'DD/MM' },
      { value: 'MDY', label: 'MM/DD' },
    ];
  });

  readonly analyticsBasisOptions = computed<
    readonly SegmentedOption<AnalyticsBasisMode>[]
  >(() => {
    const basis = this.store.report()?.analyticsBasis;
    const vnCount = basis?.transcribedVoiceNotes ?? 0;
    return [
      {
        value: 'text_and_audio',
        label:
          vnCount > 0
            ? `🎙️ Text + Audio & Translation (${vnCount})`
            : '🎙️ Text + Audio & Translation',
      },
      {
        value: 'text_only',
        label: '📄 Written Text Only',
      },
    ];
  });

  readonly sentimentSplitSegments = computed<readonly AhSplitBarSegment[]>(
    () => {
      const rep = this.store.report();
      if (!rep) return [];
      const s = rep.deepAnalytics.overallSentiment;
      return [
        {
          label: '😊 Positive / Affectionate',
          percentage: s.positivePct,
          value: `${s.positivePct}%`,
          color: '#25D366',
        },
        {
          label: '⚖️ Neutral / Informative',
          percentage: s.neutralPct,
          value: `${s.neutralPct}%`,
          color: '#38BDF8',
        },
        {
          label: '⚡ Tension / Negative',
          percentage: s.negativePct,
          value: `${s.negativePct}%`,
          color: '#F43F5E',
        },
      ];
    },
  );

  readonly sessionGapSegmentOptions: readonly SegmentedOption<string>[] = [
    { value: '60', label: '1h' },
    { value: '180', label: '3h' },
    { value: '360', label: '6h' },
    { value: '720', label: '12h' },
  ];

  readonly selectedSessionGapStr = computed(() =>
    String(this.store.sessionGapMinutes()),
  );

  readonly timelineGranularityOptions = computed<
    readonly SegmentedOption<'daily' | 'monthly'>[]
  >(() => {
    const streaks = this.store.report()?.streaksAndTimeline;
    const dCount = streaks?.dailyTimeline.length ?? 0;
    const mCount = streaks?.monthlyTimeline.length ?? 0;
    return [
      { value: 'daily', label: `Daily (${dCount}d)` },
      { value: 'monthly', label: `Monthly (${mCount}m)` },
    ];
  });

  readonly transcriptTypeOptions: readonly SegmentedOption<TranscriptTypeFilter>[] =
    [
      { value: 'all', label: 'All' },
      { value: 'audio', label: '🎙️ Voice Notes' },
      { value: 'multiline', label: 'Multi-Line' },
      { value: 'questions', label: 'Questions' },
      { value: 'media', label: 'All Media / Del' },
    ];

  readonly endpointPresetOptions: readonly SegmentedOption<
    'tunnel' | 'local'
  >[] = [
    { value: 'tunnel', label: '🌐 Public Ngrok Tunnel' },
    { value: 'local', label: '🐳 Local Docker (127.0.0.1:5678)' },
  ];

  readonly activeEndpointPreset = computed<'tunnel' | 'local'>(() =>
    this.store.webhookSettings().webhookUrl === this.localPresetUrl
      ? 'local'
      : 'tunnel',
  );

  readonly sampleSizeSegmentOptions: readonly SegmentedOption<string>[] = [
    { value: '25', label: '25 excerpts' },
    { value: '40', label: '40 excerpts' },
    { value: '60', label: '60 excerpts' },
  ];

  readonly selectedSampleSizeStr = computed(() =>
    String(this.store.webhookSettings().sampleSize),
  );

  readonly dashboardTabs = computed<readonly AhTabItem<WhatsAppDashboardTab>[]>(
    () => {
      const rep = this.store.report();
      const hasAi = Boolean(this.store.aiAnalysis());
      const mediaCount =
        (rep?.mediaAnalytics.totalMediaMessages || 0) +
        (rep?.mediaAnalytics.voiceNotes.length || 0);
      const t = this.copy().tabs;
      return [
        { id: 'overview', label: t.overview, icon: '📊' },
        {
          id: 'media',
          label: t.media,
          icon: '🎙️',
          count:
            rep?.mediaAnalytics.totalMediaMessages ||
            (mediaCount > 0 ? mediaCount : undefined),
        },
        { id: 'dynamics', label: t.dynamics, icon: '⚡' },
        {
          id: 'lexical',
          label: t.lexical,
          icon: '🔤',
          count: rep?.topWords.length || undefined,
        },
        { id: 'heatmap', label: t.heatmap, icon: '🗓️' },
        { id: 'wrapped', label: t.wrapped, icon: '🎴' },
        {
          id: 'ai-insights',
          label: t.aiInsights,
          icon: hasAi ? '✅' : '🧠',
        },
        {
          id: 'transcript',
          label: t.transcript,
          icon: '💬',
          count: rep?.totalMessages || undefined,
        },
      ];
    },
  );

  readonly mediaSplitSegments = computed<readonly AhSplitBarSegment[]>(() => {
    const rep = this.store.report();
    if (!rep) return [];
    const m = rep.mediaAnalytics;
    const total = Math.max(
      1,
      m.byCategory.audio +
        m.byCategory.image +
        m.byCategory.video +
        m.byCategory.sticker +
        m.byCategory.gif +
        m.byCategory.document +
        m.byCategory.generic_media,
    );
    const items: Array<{ label: string; count: number; color: string }> = [
      {
        label: '🎙️ Voice / Audio',
        count: m.byCategory.audio,
        color: '#25D366',
      },
      {
        label: '🖼️ Photos / Images',
        count: m.byCategory.image,
        color: '#38BDF8',
      },
      { label: '🎬 Videos', count: m.byCategory.video, color: '#A78BFA' },
      {
        label: '✨ Stickers & GIFs',
        count: m.byCategory.sticker + m.byCategory.gif,
        color: '#F59E0B',
      },
      {
        label: '📄 Docs & Other',
        count: m.byCategory.document + m.byCategory.generic_media,
        color: '#F472B6',
      },
    ];
    return items
      .filter((it) => it.count > 0)
      .map((it) => ({
        label: it.label,
        percentage: Math.round((it.count / total) * 1000) / 10,
        value: `${it.count}`,
        color: it.color,
      }));
  });

  readonly splitBarSegments = computed<readonly AhSplitBarSegment[]>(() => {
    const rep = this.store.report();
    if (!rep) return [];
    return rep.participants.map((p) => ({
      label: p.name,
      percentage: p.messageSharePct,
      value: `${p.messageCount.toLocaleString()} msgs`,
      color: p.accentColor,
    }));
  });

  readonly heatmapRows = computed<readonly AhHeatmapRowData[]>(() => {
    const rep = this.store.report();
    if (!rep) return [];
    return rep.heatmap.byDayOfWeek.map((d) => ({
      label: d.dayName,
      shortLabel: d.shortName,
      values: rep.heatmap.matrix[d.dayIndex] ?? [],
    }));
  });

  readonly participantSelectOptions = computed<
    readonly AhSelectOption<string>[]
  >(() => {
    const rep = this.store.report();
    if (!rep) return [{ value: 'ALL', label: 'All Participants' }];
    return [
      {
        value: 'ALL',
        label: `All Participants (${rep.participants.length})`,
        icon: '👥',
      },
      ...rep.participants.map((p) => ({
        value: p.name,
        label: p.name,
        hint: `${p.messageCount} msgs`,
        icon: '👤',
      })),
    ];
  });

  readonly maxTimelineMessages = computed(() => {
    const pts = this.store.timelinePoints();
    if (pts.length === 0) {
      return 1;
    }
    return Math.max(1, ...pts.map((p) => p.totalMessages));
  });

  readonly maxDayCount = computed(() => {
    const rep = this.store.report();
    if (!rep) {
      return 1;
    }
    return Math.max(1, ...rep.heatmap.byDayOfWeek.map((d) => d.count));
  });

  readonly maxTopWordCount = computed(() => {
    const rep = this.store.report();
    if (!rep || rep.topWords.length === 0) {
      return 1;
    }
    return Math.max(1, rep.topWords[0].count);
  });

  readonly maxTopEmojiCount = computed(() => {
    const rep = this.store.report();
    if (!rep || rep.topEmojis.length === 0) {
      return 1;
    }
    return Math.max(1, rep.topEmojis[0].count);
  });

  readonly paginatedVoiceNotes = computed(() => {
    const list = this.store.report()?.mediaAnalytics.voiceNotes ?? [];
    const size = this.voiceNotesPageSize();
    const totalPages = Math.max(1, Math.ceil(list.length / size));
    const page = Math.max(1, Math.min(totalPages, this.voiceNotesPage()));
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  readonly paginatedMediaGallery = computed(() => {
    const list = this.store.report()?.mediaAnalytics.mediaGallery ?? [];
    const size = this.mediaGalleryPageSize();
    const totalPages = Math.max(1, Math.ceil(list.length / size));
    const page = Math.max(1, Math.min(totalPages, this.mediaGalleryPage()));
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  readonly paginatedTopWords = computed(() => {
    const list = this.store.report()?.topWords ?? [];
    const size = this.topWordsPageSize();
    const totalPages = Math.max(1, Math.ceil(list.length / size));
    const page = Math.max(1, Math.min(totalPages, this.topWordsPage()));
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  readonly topWordsStartOffset = computed(() => {
    const list = this.store.report()?.topWords ?? [];
    const size = this.topWordsPageSize();
    const totalPages = Math.max(1, Math.ceil(list.length / size));
    const page = Math.max(1, Math.min(totalPages, this.topWordsPage()));
    return (page - 1) * size;
  });

  readonly paginatedTopEmojis = computed(() => {
    const list = this.store.report()?.topEmojis ?? [];
    const size = this.topEmojisPageSize();
    const totalPages = Math.max(1, Math.ceil(list.length / size));
    const page = Math.max(1, Math.min(totalPages, this.topEmojisPage()));
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  readonly topEmojisStartOffset = computed(() => {
    const list = this.store.report()?.topEmojis ?? [];
    const size = this.topEmojisPageSize();
    const totalPages = Math.max(1, Math.ceil(list.length / size));
    const page = Math.max(1, Math.min(totalPages, this.topEmojisPage()));
    return (page - 1) * size;
  });

  readonly paginatedTranscriptMessages = computed(() => {
    const list = this.store.filteredTranscriptMessages();
    const size = this.transcriptPageSize();
    const totalPages = Math.max(1, Math.ceil(list.length / size));
    const page = Math.max(1, Math.min(totalPages, this.transcriptPage()));
    const start = (page - 1) * size;
    return list.slice(start, start + size);
  });

  readonly formattedPayloadJson = computed(() => {
    const payload = this.store.aiPayload();
    if (!payload) {
      return '{}';
    }
    return JSON.stringify(payload, null, 2);
  });

  formatDuration(seconds: number): string {
    return formatDurationCompact(seconds);
  }

  formatBytes(bytes: number): string {
    return formatBytesCompact(bytes);
  }

  private saveTimeoutId?: ReturnType<typeof setTimeout>;
  private flashSavedVoiceNote(key: string): void {
    this.savedVoiceNoteKey.set(key);
    if (this.saveTimeoutId) clearTimeout(this.saveTimeoutId);
    this.saveTimeoutId = setTimeout(
      () => this.savedVoiceNoteKey.set(null),
      2500,
    );
  }

  onVoiceNoteTranscriptInput(key: string, value: string): void {
    this.store.updateVoiceNoteTranscript(key, value);
    this.flashSavedVoiceNote(key);
  }

  onVoiceNoteTranslationInput(key: string, value: string): void {
    this.store.updateVoiceNoteTranslation(key, value);
    this.flashSavedVoiceNote(key);
  }

  setAnalyticsBasis(mode: AnalyticsBasisMode): void {
    this.store.setAnalyticsBasisMode(mode);
  }

  async onFileSelected(file: File): Promise<void> {
    await this.store.ingestUploadedFile(file);
  }

  async onFilesSelected(files: readonly File[]): Promise<void> {
    await this.store.ingestUploadedFiles(files);
  }

  async onFileInputChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const fileList = input.files;
    if (fileList && fileList.length > 0) {
      const files = Array.from(fileList);
      await this.store.ingestUploadedFiles(files);
      input.value = '';
    }
  }

  setDateMode(mode: DateOrderMode): void {
    this.store.setDateOrderMode(mode);
  }

  onSessionGapChange(minutesStr: string): void {
    const parsed = Number(minutesStr);
    if (!Number.isNaN(parsed) && parsed > 0) {
      this.store.setSessionGapMinutes(parsed);
    }
  }

  setTab(tab: WhatsAppDashboardTab): void {
    this.store.setActiveTab(tab);
  }

  submitCustomStopword(): void {
    const raw = this.stopwordInput().trim();
    if (!raw) {
      this.stopwordError.set('Please enter a word to exclude.');
      return;
    }
    if (raw.length < 2) {
      this.stopwordError.set('Word must be at least 2 characters.');
      return;
    }
    if (/^[^a-zA-Z\u0600-\u06FF\u00C0-\u017F]+$/.test(raw)) {
      this.stopwordError.set(
        'Word must contain letters (not only punctuation or numbers).',
      );
      return;
    }
    const normalized = raw.toLowerCase();
    const existing = this.store.customStopwords().map((w) => w.toLowerCase());
    if (existing.includes(normalized)) {
      this.stopwordError.set(`"${raw}" is already in your exclusion list.`);
      return;
    }
    this.stopwordError.set(null);
    this.store.addCustomStopword(raw);
    this.stopwordInput.set('');
  }

  onStopwordInputChange(val: string): void {
    this.stopwordInput.set(val);
    if (this.stopwordError()) {
      this.stopwordError.set(null);
    }
  }

  clearTranscriptSearch(): void {
    this.transcriptPage.set(1);
    this.store.setTranscriptSearch('');
  }

  setTranscriptType(filter: TranscriptTypeFilter): void {
    this.transcriptPage.set(1);
    this.store.setTranscriptTypeFilter(filter);
  }

  onParticipantFilterChange(value: string | null): void {
    this.transcriptPage.set(1);
    this.store.setTranscriptParticipantFilter(value || 'ALL');
  }

  onTranscriptSearchChange(query: string): void {
    this.transcriptPage.set(1);
    this.store.setTranscriptSearch(query);
  }

  transcribeCurrentVoiceNotesPage(): void {
    const currentSlice = this.paginatedVoiceNotes();
    if (currentSlice.length > 0) {
      void this.store.transcribeVoiceNotesSlice(currentSlice);
    }
  }

  barHeightPct(val: number, max: number): number {
    if (max <= 0 || val <= 0) {
      return 4;
    }
    return Math.max(8, Math.round((val / max) * 100));
  }

  participantShareInPoint(
    point: TimelinePoint,
    participantName: string,
  ): number {
    if (point.totalMessages <= 0) {
      return 0;
    }
    const count = point.byParticipant[participantName] ?? 0;
    return Math.round((count / point.totalMessages) * 100);
  }

  participantColor(name: string): string {
    const rep = this.store.report();
    if (!rep) {
      return '#25D366';
    }
    const found = rep.participants.find(
      (p: ParticipantAnalytics) => p.name === name,
    );
    return found?.accentColor ?? '#25D366';
  }

  copyWrappedText(): void {
    const rep = this.store.report();
    if (!rep) {
      return;
    }
    const w = rep.wrapped;
    const summaryText = [
      `📊 ChatPulse WhatsApp Wrapped — ${w.chatTitle}`,
      `📅 Span: ${w.dateRangeLabel} (${w.activeDays} active days · 🔥 ${w.longestStreakDays}-day streak)`,
      `💬 Volume: ${w.totalMessages.toLocaleString()} messages · ${w.totalWords.toLocaleString()} words`,
      `🏆 Top Chatter: ${w.topChatter.name} (${w.topChatter.pct}%)`,
      `⚡ Fastest Responder: ${w.fastestResponder.name} (${this.formatDuration(w.fastestResponder.medianSeconds)} median)`,
      `🚀 Top Initiator: ${w.topInitiator.name} (${w.topInitiator.pct}%)`,
      `✨ Vibe: ${w.vibeBadge} · ${w.peakTimePersona}`,
      `🎯 Top Emojis: ${w.signatureEmojis.join(' ')}`,
      `🔤 Signature Words: ${w.signatureWords.join(', ')}`,
    ].join('\n');

    void this.store.copyTextToClipboard(summaryText, 'wrapped-text');
  }

  copyWrappedJson(): void {
    const rep = this.store.report();
    if (!rep) {
      return;
    }
    const json = JSON.stringify(rep.wrapped, null, 2);
    void this.store.copyTextToClipboard(json, 'wrapped-json');
  }

  copyWebhookPayloadJson(): void {
    void this.store.copyTextToClipboard(
      this.formattedPayloadJson(),
      'webhook-payload',
    );
  }

  updateWebhookUrl(url: string): void {
    this.store.updateWebhookSettings({ webhookUrl: url });
  }

  updateAuthHeaderName(name: string): void {
    this.store.updateWebhookSettings({ authHeaderName: name });
  }

  updateAuthHeaderValue(val: string): void {
    this.store.updateWebhookSettings({ authHeaderValue: val });
  }

  onSampleSizeSegmentChange(sizeStr: string): void {
    this.store.updateWebhookSettings({ sampleSize: Number(sizeStr) });
  }

  formatSavedTimestamp(iso: string): string {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso.slice(0, 16).replace('T', ' ');
    }
  }
}
