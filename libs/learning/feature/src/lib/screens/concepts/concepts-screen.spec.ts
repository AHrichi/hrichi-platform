import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FIXTURE_IDS, sampleConcept, sampleTopic } from '@ah/learning/domain';
import { LearningStore } from '../../store/learning.store';
import { ConceptsScreen } from './concepts-screen';

describe('ConceptsScreen', () => {
  it('filters concepts by search query, topic, and status, and saves concept edits with new topic', async () => {
    const topicEcon = sampleTopic({ id: FIXTURE_IDS.topic, name: 'Economics' });
    const topicAlg = sampleTopic({
      id: '0b6f0c30-0000-4000-8000-000000000011',
      name: 'Algorithms',
      hue: 210,
    });
    const conceptA = sampleConcept({
      id: FIXTURE_IDS.concept,
      title: 'Opportunity cost',
      topicId: topicEcon.id,
      status: 'active',
      explanationHistory: [
        {
          essence: 'Older line about tradeoffs',
          simple: null,
          analogy: null,
          misconception: null,
          ownWords: null,
          by: 'ai',
          savedAt: '2026-11-10T09:00:00.000Z',
        },
      ],
    });
    const conceptB = sampleConcept({
      id: '0b6f0c30-0000-4000-8000-000000000012',
      title: 'Binary search',
      topicId: topicAlg.id,
      status: 'suspended',
      explanation: {
        ...sampleConcept().explanation,
        essence: 'Halve a sorted array on every step.',
      },
    });

    const updateConcept = vi.fn().mockResolvedValue(undefined);
    const addTopic = vi.fn().mockResolvedValue(topicAlg);

    TestBed.configureTestingModule({
      imports: [ConceptsScreen],
      providers: [
        provideRouter([]),
        {
          provide: LearningStore,
          useValue: {
            ready: signal(true),
            library: signal([conceptA, conceptB]),
            topics: signal([topicEcon]),
            links: signal([]),
            updateConcept,
            addTopic,
            deleteConcept: vi.fn(),
            addConcept: vi.fn(),
            addLink: vi.fn(),
            dismissLink: vi.fn(),
          },
        },
      ],
    });

    const fixture = TestBed.createComponent(ConceptsScreen);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('.concept')).toHaveLength(2);
    expect(host.textContent).toContain('Previous versions (1)');

    const search = host.querySelector('#library-search') as HTMLInputElement;
    search.value = 'binary';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(host.querySelectorAll('.concept')).toHaveLength(1);
    expect(host.textContent).toContain('Binary search');

    const statusSelect = host.querySelector(
      '#library-status',
    ) as HTMLSelectElement;
    statusSelect.value = 'active';
    statusSelect.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(host.textContent).toContain('No concepts match that filter.');

    const clearBtn = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Clear filters'),
    ) as HTMLButtonElement;
    clearBtn.click();
    fixture.detectChanges();
    expect(host.querySelectorAll('.concept')).toHaveLength(2);

    const editBtn = host.querySelector(
      `button[aria-label="Edit ${conceptA.title}"]`,
    ) as HTMLButtonElement;
    editBtn.click();
    fixture.detectChanges();

    const essenceBox = host.querySelector(
      `#edit-essence-${conceptA.id}`,
    ) as HTMLTextAreaElement;
    essenceBox.value = 'Updated concise essence';
    essenceBox.dispatchEvent(new Event('input'));

    const topicBox = host.querySelector(
      `#edit-topic-${conceptA.id}`,
    ) as HTMLSelectElement;
    topicBox.value = '__new__';
    topicBox.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const newTopicInput = host.querySelector(
      `#edit-new-topic-${conceptA.id}`,
    ) as HTMLInputElement;
    newTopicInput.value = 'Algorithms';
    newTopicInput.dispatchEvent(new Event('input'));

    const saveBtn = Array.from(host.querySelectorAll('button')).find((b) =>
      b.textContent?.includes('Save changes'),
    ) as HTMLButtonElement;
    saveBtn.click();
    await new Promise((r) => setTimeout(r, 0));

    expect(addTopic).toHaveBeenCalledWith('Algorithms');
    expect(updateConcept).toHaveBeenCalledWith(
      conceptA.id,
      expect.objectContaining({
        topicId: topicAlg.id,
        explanation: expect.objectContaining({
          essence: 'Updated concise essence',
          by: 'user',
        }),
      }),
      expect.arrayContaining(['explanation', 'topic']),
    );
  });
});
