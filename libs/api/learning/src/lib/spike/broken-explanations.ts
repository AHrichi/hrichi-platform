/**
 * Quality-gate cases for the Jev spike (design §6.4): each golden concept
 * once as written (every question should come back clean), once with a
 * false claim added to its simple explanation (`faithful` should be no),
 * and once with a true statement passed off as the misconception
 * (`misconception` should be no). Leaky prompts are built in the spike by
 * copying a prompt's answer into its question.
 */
export interface GateMutation {
  concept: string;
  /** Appended to the simple explanation: false, or unsupported by the span. */
  falseClaim: string;
  /** Put in place of the misconception: actually true, so not a mistake. */
  notAMistake: string;
}

export const GATE_MUTATIONS: readonly GateMutation[] = [
  {
    concept: 'Opportunity cost',
    falseClaim: 'Economists measure it only in dollars, never in time.',
    notAMistake:
      'People think opportunity cost is about the best option you give up. That is the definition.',
  },
  {
    concept: 'Retrieval practice',
    falseClaim: 'It only works for children under twelve.',
    notAMistake: 'People think testing yourself helps you remember. It does.',
  },
  {
    concept: 'Photosynthesis',
    falseClaim: 'It happens mainly in the roots at night.',
    notAMistake: 'People think plants need light for photosynthesis. They do.',
  },
  {
    concept: 'Binary search',
    falseClaim: 'It works just as well on unsorted lists.',
    notAMistake: 'People think binary search needs a sorted list. It does.',
  },
  {
    concept: 'Interest rates and inflation',
    falseClaim: 'Raising rates makes prices fall the very next day.',
    notAMistake:
      'People think higher rates make borrowing more expensive. They do.',
  },
  {
    concept: 'The spacing effect',
    falseClaim: 'Cramming the night before gives the best long-term memory.',
    notAMistake: 'People think spacing study out helps memory. It does.',
  },
  {
    concept: "Gutenberg's printing press",
    falseClaim: 'He built it in 1840 in London.',
    notAMistake: 'People think the press made books cheaper. It did.',
  },
  {
    concept: 'Speed of light',
    falseClaim: 'Light is fastest in water.',
    notAMistake: 'People think light is very fast. It is.',
  },
  {
    concept: 'The Feynman technique',
    falseClaim:
      'It means memorising the most technical definition you can find.',
    notAMistake: 'People think explaining simply reveals gaps. It does.',
  },
  {
    concept: 'Red, green, refactor',
    falseClaim: 'You write every test for the whole project before any code.',
    notAMistake: 'People think the first test should fail. It should.',
  },
  {
    concept: 'Bacteria and viruses',
    falseClaim: 'Antibiotics are the standard cure for the flu.',
    notAMistake: 'People think viruses need a host cell. They do.',
  },
  {
    concept: 'Interleaving and blocking',
    falseClaim: 'Interleaving feels easier and faster than blocking.',
    notAMistake: 'People think interleaving feels harder. It does.',
  },
];
