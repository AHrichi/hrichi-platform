import type { Lesson } from '../../model/lesson';

/**
 * The stand-in for a lesson that isn't written yet (`ready: false`). It is a
 * real, valid lesson, so every screen works before the content does.
 */
export function pendingLesson(id: string, title: string): Lesson {
  return {
    id,
    learn: [
      'Where this lesson sits in the course',
      'What it will cover',
      'Where to go meanwhile',
    ],
    scene: {
      nodes: [
        { id: 'you', kind: 'user', at: { x: 1, y: 3 }, label: 'You' },
        { id: 'course', kind: 'service', at: { x: 5, y: 3 }, label: 'Course' },
      ],
      edges: [{ id: 'you-course', from: 'you', to: 'course' }],
      zones: [
        { id: 'desk', from: { x: 0, y: 2 }, to: { x: 2, y: 4 }, hue: 'green' },
      ],
      notes: [],
    },
    hud: [{ id: 'status', label: 'Status', icon: 'clock', value: 'Soon' }],
    steps: [
      {
        id: 'soon',
        label: 'Soon',
        kind: 'problem',
        title: 'This lesson is being written',
        body: [
          'This lesson is on its way. Its steps, diagram and questions arrive in a later release.',
        ],
        ops: [{ op: 'packet', edge: 'you-course', kind: 'request' }],
        learns: [0],
      },
      {
        id: 'covers',
        label: 'Coverage',
        kind: 'technique',
        title: 'What it will cover',
        body: ['The title and summary in the sidebar say what it teaches.'],
        ops: [{ op: 'update-node', id: 'course', patch: { state: 'focus' } }],
        learns: [1],
      },
      {
        id: 'meanwhile',
        label: 'Meanwhile',
        kind: 'technique',
        title: 'Meanwhile, try a finished lesson',
        body: ['Lessons marked as ready play in full.'],
        ops: [
          { op: 'packet', edge: 'you-course', kind: 'response', reverse: true },
        ],
        learns: [2],
      },
      {
        id: 'practice',
        label: 'Practice',
        kind: 'technique',
        title: 'Practice what you have learned',
        body: ['Practice draws questions from finished lessons.'],
        ops: [],
      },
      {
        id: 'lab',
        label: 'Lab',
        kind: 'case',
        title: 'Or build something in the Design Lab',
        body: ['The lab simulates traffic through a system you build.'],
        ops: [],
      },
      {
        id: 'recap',
        label: 'Recap',
        kind: 'recap',
        title: 'Back soon',
        body: ['Check back after the next release.'],
        ops: [{ op: 'set-metric', id: 'status', value: 'Soon' }],
        takeaways: [
          'This lesson is not written yet',
          'Finished lessons play in full',
          'Practice and the lab work today',
        ],
      },
    ],
    checks: [
      {
        id: 'ready',
        kind: 'choice',
        prompt: 'Is this lesson finished?',
        options: ['Yes', 'Not yet'],
        answer: 1,
        explain: 'It is still being written.',
      },
      {
        id: 'where',
        kind: 'choice',
        prompt: 'Where do finished lessons play?',
        options: ['In full', 'As a stub'],
        answer: 0,
        explain: 'Ready lessons play every step.',
      },
      {
        id: 'steps',
        kind: 'numeric',
        prompt: 'How many steps does this stand-in have?',
        unit: 'steps',
        answer: 6,
        tolerance: 0.05,
        explain: 'Six, the minimum.',
      },
    ],
    cards: [
      {
        front: `What will "${title}" teach?`,
        back: 'See its summary in the course sidebar.',
      },
      {
        front: 'What does a stand-in lesson mean?',
        back: 'The real lesson is not written yet.',
      },
      {
        front: 'Where can you practise today?',
        back: 'In Practice and the Design Lab.',
      },
    ],
  };
}
