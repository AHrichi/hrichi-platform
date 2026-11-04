import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PreferencesStore } from '@ah/shared/state';
import { provideAppMode } from '@ah/platform/app-mode';
import { AlarmEngineStore } from './alarm-engine.store';

describe('AlarmEngineStore', () => {
  let store: AlarmEngineStore;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [AlarmEngineStore],
    });
    store = TestBed.inject(AlarmEngineStore);
  });

  it('initializes with starter chapters and system state', () => {
    expect(store.chapters().length).toBe(0);
    expect(store.checklist().length).toBe(9);
    expect(store.decision().alarms.length).toBeGreaterThan(0);
  });

  it('updates questionnaire inputs and recalculates decision reactively', () => {
    store.setTargetChapter(10);
    expect(store.questionnaire().targetChapterNumber).toBe(10);

    store.setCompletionStatus('NO');
    expect(store.decision().isRepeat).toBe(true);
    expect(store.decision().targetChapter).toBe(10);
  });

  it('manages checklist steps and reset', () => {
    store.toggleChecklistStep(8); // Step 9
    expect(store.checklist()[8]).toBe(true);

    store.resetChecklist();
    expect(store.systemState().checklistState.every((s) => !s)).toBe(true);
  });

  it('commits nightly ritual and advances target chapter', () => {
    store.setCompletionStatus('YES');
    store.setTargetChapter(5);
    store.setQuizScore(95);
    store.setQuizMissed(0);

    store.commitNightlyRitual();

    const ch5 = store.chapters().find((c) => c.chapterNumber === 5);
    expect(ch5).toBeDefined();
    expect(ch5?.quizScorePercent).toBe(95);
    expect(store.questionnaire().targetChapterNumber).toBe(6);
  });

  it('toggles chapter reviews directly in tracker', () => {
    store.setTargetChapter(1);
    store.commitNightlyRitual();

    const ch1 = store.chapters()[0];
    const initialD3 = ch1.d3Completed;

    store.toggleChapterReview(ch1.chapterNumber, 'D-3');
    const updatedCh1 = store.chapters().find((c) => c.chapterNumber === ch1.chapterNumber);
    expect(updatedCh1?.d3Completed).toBe(!initialD3);
  });

  it('auto-computes D-3, D-7, and D-14 dates when originalStudyDate changes in modal', () => {
    store.openAddChapterModal();
    expect(store.editingChapter()).toBeDefined();

    store.onModalStudyDateChanged('2026-11-10');
    const editing = store.editingChapter();
    expect(editing?.originalStudyDate).toBe('2026-11-10');
    expect(editing?.d3Date).toBe('2026-11-13'); // +3 days
    expect(editing?.d7Date).toBe('2026-11-17'); // +7 days
    expect(editing?.d14Date).toBe('2026-11-24'); // +14 days
  });

  it('supports creating and filtering by topics', () => {
    store.addTopic('Distributed Systems', '#06b6d4');
    expect(store.topics().some((t) => t.id === 'distributed-systems')).toBe(true);

    store.setSelectedTopicId('distributed-systems');
    expect(store.selectedTopicId()).toBe('distributed-systems');
  });

  it('supports multilingual dictionaries and switches language', () => {
    expect(store.dict().meta.title).toBe('Nightly Alarm Decision Engine');

    store.setLanguage('fr');
    expect(store.dict().meta.title).toBe('Moteur de Décision des Alarmes Nocturnes');

    store.setLanguage('ar');
    expect(store.dict().meta.title).toBe('محرك قرارات منبهات الليل');
    expect(store.isRtl()).toBe(true);
  });

  it('adapts tomorrow schedule when MISSED_GOALS is selected', () => {
    store.setCompletionStatus('MISSED_GOALS');
    store.setMissedReason('OVERWHELMED');
    store.setTargetChapter(3);
    store.setTargetChapterTitle('Cache Coherence');

    const decision = store.decision();
    expect(decision.isAdaptiveReset).toBe(true);
    expect(decision.targetChapter).toBe(3);
    const alarm6 = decision.alarms.find((a) => a.time === '06:00');
    expect(alarm6?.title).toContain('DE-ESCALATE: Ch. 3 - Cache Coherence');
  });

  it('toggles collapsible sections and calculates next upcoming alarm', () => {
    expect(store.isSectionCollapsed('checklist')).toBe(false);
    store.toggleSection('checklist');
    expect(store.isSectionCollapsed('checklist')).toBe(true);
    store.toggleSection('checklist');
    expect(store.isSectionCollapsed('checklist')).toBe(false);

    const upcoming = store.nextUpcomingAlarm();
    expect(upcoming).toBeDefined();
    expect(upcoming?.time).toBeDefined();
  });

  it('detects standalone mode and allows local theme and language changes', () => {
    expect(store.isEmbedded()).toBe(false);
    expect(store.isDark()).toBe(true);

    store.toggleTheme();
    expect(store.isDark()).toBe(false);
    store.toggleTheme();
    expect(store.isDark()).toBe(true);
  });

  it('submits a topic with description and bulk imports a list of syllabus chapters', () => {
    const rawSyllabus = `
1. Introduction & RPCs
2. Primary-Backup Replication
3. Raft Consensus Algorithm
4. Byzantine Fault Tolerance
    `.trim();

    store.saveTopicAndSyllabus({
      name: 'Distributed Systems',
      description: 'MIT 6.824: Fault tolerance, consensus, and scale.',
      color: '#06b6d4',
      rawSyllabus,
      importMode: 'queue',
    });

    const topic = store.topics().find((t) => t.id === 'distributed-systems');
    expect(topic).toBeDefined();
    expect(topic?.description).toBe('MIT 6.824: Fault tolerance, consensus, and scale.');

    const topicChapters = store.chapters().filter((c) => c.topicId === 'distributed-systems');
    expect(topicChapters.length).toBe(4);
    expect(topicChapters[0].title).toBe('Introduction & RPCs');
    expect(topicChapters[2].title).toBe('Raft Consensus Algorithm');

    // Verify stats
    const stats = store.topicSyllabusStats();
    expect(stats.total).toBe(4);
    expect(stats.completed).toBe(0);
    expect(stats.percent).toBe(0);
  });

  it('computes 7-day outlook and opens rapid recall modal', () => {
    const outlook = store.sevenDayOutlook();
    expect(outlook.length).toBe(7);
    expect(store.highCollisionDaysCount()).toBe(0);

    // Add a chapter and test recall modal
    store.setTargetChapter(1);
    store.commitNightlyRitual();

    store.openRecallModal(1, 'D-3');
    const prompt = store.activeRecallPrompt();
    expect(prompt).toBeDefined();
    expect(prompt?.chapterNumber).toBe(1);
    expect(prompt?.reviewType).toBe('D-3');

    store.completeRecallReview(true);
    expect(store.activeRecallPrompt()).toBeNull();
  });

  it('updates n8n webhook URL and parses text document with client fallback', async () => {
    store.setN8nWebhookUrl('http://custom-n8n:5678/webhook/parse-chapter-doc');
    expect(store.n8nWebhookUrl()).toBe(
      'http://custom-n8n:5678/webhook/parse-chapter-doc',
    );

    const content = `
Course: Microservices Architecture
1. Service Decomposition & Boundaries
2. Event-Driven Messaging with Kafka
3. Distributed Tracing & OpenTelemetry
    `.trim();

    const mockFile = new File([content], 'microservices-syllabus.txt', {
      type: 'text/plain',
    });

    const res = await store.parseDocumentFile(mockFile);
    expect(res.success).toBe(true);
    expect(res.topicName).toBe('Microservices Architecture');
    expect(res.totalChapters).toBe(3);
    expect(res.outlineText).toContain('1. Service Decomposition & Boundaries');
    expect(res.outlineText).toContain('3. Distributed Tracing & OpenTelemetry');
  });

  it('parses markdown files with chapters across multiple formats', async () => {
    const mdContent = `
# Advanced Kubernetes
Description: Comprehensive hands-on guide.

## 1. Custom Resource Definitions
## 2. Operator Pattern & Controllers
## 3. Storage & CSI Drivers
## 4. Multi-cluster Networking
    `.trim();

    const mockMdFile = new File([mdContent], 'kubernetes-guide.md', {
      type: 'text/markdown',
    });

    const res = await store.parseDocumentFile(mockMdFile);
    expect(res.success).toBe(true);
    expect(res.topicName).toBe('Advanced Kubernetes');
    expect(res.totalChapters).toBe(4);
    expect(res.outlineText).toContain('1. Custom Resource Definitions');
  });

  it('parses CSV / spreadsheet syllabus files with column headers', async () => {
    const csvContent = `Chapter,Title\n1,Relational Algebra\n2,B-Trees Indexing\n3,WAL & Crash Recovery`;
    const mockCsvFile = new File([csvContent], 'database_systems.csv', {
      type: 'text/csv',
    });

    const res = await store.parseDocumentFile(mockCsvFile);
    expect(res.success).toBe(true);
    expect(res.totalChapters).toBe(3);
    expect(res.outlineText).toContain('1. Relational Algebra');
    expect(res.outlineText).toContain('3. WAL & Crash Recovery');
  });
});

describe('AlarmEngineStore (Embedded under Portfolio Shell)', () => {
  it('detects embedded mode and derives language and dark mode from parent PreferencesStore', () => {
    const mockPreferences = {
      language: () => 'fr' as const,
      isDark: () => false,
      setLanguage: vi.fn(),
      toggleTheme: vi.fn(),
    };

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideAppMode('embedded-demo'),
        AlarmEngineStore,
        { provide: PreferencesStore, useValue: mockPreferences },
      ],
    });

    const embeddedStore = TestBed.inject(AlarmEngineStore);
    expect(embeddedStore.isEmbedded()).toBe(true);
    expect(embeddedStore.activeLanguage()).toBe('fr');
    expect(embeddedStore.isDark()).toBe(false);
    expect(embeddedStore.dict().meta.title).toBe(
      'Moteur de Décision des Alarmes Nocturnes',
    );
  });
});
