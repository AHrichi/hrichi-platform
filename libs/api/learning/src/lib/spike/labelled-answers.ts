/**
 * Hand-labelled answers for the Jev spike (design §6.4). Each answer to a
 * golden concept's graded prompt records which key points it states, in
 * key-point order; the expected verdict follows (all → nailed, some →
 * close, none → missed). Answers are written the way people type on a
 * phone: paraphrased, terse, sometimes wrong.
 */
export interface LabelledAnswer {
  concept: string;
  /** Index into the golden concept's prompts. */
  prompt: number;
  answer: string;
  covers: boolean[];
}

const T = true;
const F = false;

export const LABELLED_ANSWERS: readonly LabelledAnswer[] = [
  // Opportunity cost
  {
    concept: 'Opportunity cost',
    prompt: 0,
    answer:
      "It's what you lose by not picking the next best option when you decide.",
    covers: [T, T],
  },
  {
    concept: 'Opportunity cost',
    prompt: 0,
    answer: 'The best alternative.',
    covers: [T, F],
  },
  {
    concept: 'Opportunity cost',
    prompt: 0,
    answer: 'The money you spend on something.',
    covers: [F, F],
  },
  {
    concept: 'Opportunity cost',
    prompt: 1,
    answer:
      "The $200 I'd have made working, since that was my best other option.",
    covers: [T, T],
  },
  {
    concept: 'Opportunity cost',
    prompt: 1,
    answer: 'Two hundred dollars.',
    covers: [T, F],
  },
  {
    concept: 'Opportunity cost',
    prompt: 1,
    answer: 'Nothing, the workshop was free.',
    covers: [F, F],
  },
  {
    concept: 'Opportunity cost',
    prompt: 2,
    answer: "Only the single best job counts, you don't add up all the jobs.",
    covers: [T, T],
  },
  {
    concept: 'Opportunity cost',
    prompt: 2,
    answer: 'It should be the best job only.',
    covers: [T, F],
  },
  {
    concept: 'Opportunity cost',
    prompt: 2,
    answer: "There's no mistake, that's right.",
    covers: [F, F],
  },
  // Retrieval practice
  {
    concept: 'Retrieval practice',
    prompt: 0,
    answer:
      'Testing yourself by pulling things out of memory, which makes them stick better than rereading.',
    covers: [T, T],
  },
  {
    concept: 'Retrieval practice',
    prompt: 0,
    answer: 'Quizzing yourself from memory.',
    covers: [T, F],
  },
  {
    concept: 'Retrieval practice',
    prompt: 0,
    answer: 'Reading your notes again and again until you know them.',
    covers: [F, F],
  },
  {
    concept: 'Retrieval practice',
    prompt: 1,
    answer:
      'Searching your memory takes effort, and that effort helps the right answer stick when you see it.',
    covers: [T, T],
  },
  {
    concept: 'Retrieval practice',
    prompt: 1,
    answer: 'Because trying hard to remember is good for you.',
    covers: [T, F],
  },
  {
    concept: 'Retrieval practice',
    prompt: 1,
    answer: "It doesn't help, failing just confuses you.",
    covers: [F, F],
  },
  // Photosynthesis
  {
    concept: 'Photosynthesis',
    prompt: 0,
    answer:
      'Plants use sunlight to turn CO2 and water into sugar and give off oxygen.',
    covers: [T, T, T],
  },
  {
    concept: 'Photosynthesis',
    prompt: 0,
    answer: 'Using light, plants make glucose and release oxygen.',
    covers: [T, F, T],
  },
  {
    concept: 'Photosynthesis',
    prompt: 0,
    answer: 'Plants breathe in oxygen and breathe out carbon dioxide.',
    covers: [F, F, F],
  },
  {
    concept: 'Photosynthesis',
    prompt: 1,
    answer: "It's a leftover from splitting water molecules.",
    covers: [T, T],
  },
  {
    concept: 'Photosynthesis',
    prompt: 1,
    answer: "It's a waste product.",
    covers: [T, F],
  },
  {
    concept: 'Photosynthesis',
    prompt: 1,
    answer: 'So that animals can breathe.',
    covers: [F, F],
  },
  {
    concept: 'Photosynthesis',
    prompt: 2,
    answer:
      'Most of the mass comes from CO2 in the air, not from soil minerals.',
    covers: [T, T],
  },
  {
    concept: 'Photosynthesis',
    prompt: 2,
    answer: 'It comes from carbon dioxide.',
    covers: [T, F],
  },
  {
    concept: 'Photosynthesis',
    prompt: 2,
    answer: 'It mostly comes from water in the soil.',
    covers: [F, F],
  },
  // Binary search
  {
    concept: 'Binary search',
    prompt: 0,
    answer:
      'On a sorted list, check the middle and throw away the half that cannot have it, repeat.',
    covers: [T, T, T],
  },
  {
    concept: 'Binary search',
    prompt: 0,
    answer: 'You look at the middle and cut the list in half each time.',
    covers: [F, T, T],
  },
  {
    concept: 'Binary search',
    prompt: 0,
    answer: 'Check every item from the start until you find it.',
    covers: [F, F, F],
  },
  {
    concept: 'Binary search',
    prompt: 1,
    answer: 'About 10, since every check halves what is left.',
    covers: [T, T],
  },
  {
    concept: 'Binary search',
    prompt: 1,
    answer: 'Around ten.',
    covers: [T, F],
  },
  { concept: 'Binary search', prompt: 1, answer: 'About 500.', covers: [F, F] },
  // Interest rates and inflation
  {
    concept: 'Interest rates and inflation',
    prompt: 0,
    answer:
      'Loans get pricier so people spend less, and less demand means prices rise slower.',
    covers: [T, T, T],
  },
  {
    concept: 'Interest rates and inflation',
    prompt: 0,
    answer: 'People borrow less because it costs more.',
    covers: [T, F, F],
  },
  {
    concept: 'Interest rates and inflation',
    prompt: 0,
    answer: 'Higher rates make banks print less money directly.',
    covers: [F, F, F],
  },
  {
    concept: 'Interest rates and inflation',
    prompt: 1,
    answer:
      'Existing loans and contracts only change slowly, so demand drops gradually.',
    covers: [T, T],
  },
  {
    concept: 'Interest rates and inflation',
    prompt: 1,
    answer: 'Because demand takes a while to react.',
    covers: [F, T],
  },
  {
    concept: 'Interest rates and inflation',
    prompt: 1,
    answer: 'Because the central bank waits before announcing it.',
    covers: [F, F],
  },
  // The spacing effect
  {
    concept: 'The spacing effect',
    prompt: 0,
    answer:
      'Spreading study out over time beats cramming for remembering long term.',
    covers: [T, T, T],
  },
  {
    concept: 'The spacing effect',
    prompt: 0,
    answer: 'Studying a bit over several days.',
    covers: [T, F, F],
  },
  {
    concept: 'The spacing effect',
    prompt: 0,
    answer: 'Leaving space between lines in your notes.',
    covers: [F, F, F],
  },
  {
    concept: 'The spacing effect',
    prompt: 1,
    answer:
      'You forget a little, so remembering takes effort, and that effort makes the memory stronger.',
    covers: [T, T],
  },
  {
    concept: 'The spacing effect',
    prompt: 1,
    answer: 'Effortful recall strengthens memory.',
    covers: [F, T],
  },
  {
    concept: 'The spacing effect',
    prompt: 1,
    answer: 'Your brain needs rest so it can sleep.',
    covers: [F, F],
  },
  {
    concept: 'The spacing effect',
    prompt: 2,
    answer: 'Do several short sessions spread across the two weeks.',
    covers: [T, T],
  },
  {
    concept: 'The spacing effect',
    prompt: 2,
    answer: 'Split it into shorter sessions.',
    covers: [T, F],
  },
  {
    concept: 'The spacing effect',
    prompt: 2,
    answer: 'Study all 3 hours the night before.',
    covers: [F, F],
  },
  // Gutenberg's printing press
  {
    concept: "Gutenberg's printing press",
    prompt: 0,
    answer:
      'Around 1440 his movable metal type made books cheap and quick to print.',
    covers: [T, T, T],
  },
  {
    concept: "Gutenberg's printing press",
    prompt: 0,
    answer: 'Books got much cheaper, in the 1400s.',
    covers: [T, F, T],
  },
  {
    concept: "Gutenberg's printing press",
    prompt: 0,
    answer: 'He invented paper in 1800.',
    covers: [F, F, F],
  },
  {
    concept: "Gutenberg's printing press",
    prompt: 2,
    answer:
      'Printing already existed in East Asia; his press just made it cheap and fast in Europe.',
    covers: [T, T],
  },
  {
    concept: "Gutenberg's printing press",
    prompt: 2,
    answer: 'China had printing before him.',
    covers: [T, F],
  },
  {
    concept: "Gutenberg's printing press",
    prompt: 2,
    answer: 'He invented it but only for the Bible.',
    covers: [F, F],
  },
  // Speed of light
  {
    concept: 'Speed of light',
    prompt: 0,
    answer: 'Roughly 300,000 km every second in a vacuum.',
    covers: [T, T],
  },
  {
    concept: 'Speed of light',
    prompt: 0,
    answer: '300 thousand km per second.',
    covers: [T, F],
  },
  {
    concept: 'Speed of light',
    prompt: 0,
    answer: 'About the speed of sound.',
    covers: [F, F],
  },
  {
    concept: 'Speed of light',
    prompt: 1,
    answer: 'Roughly eight minutes.',
    covers: [T],
  },
  {
    concept: 'Speed of light',
    prompt: 1,
    answer: 'A bit over 8 min.',
    covers: [T],
  },
  {
    concept: 'Speed of light',
    prompt: 1,
    answer: 'About one second.',
    covers: [F],
  },
  // The Feynman technique
  {
    concept: 'The Feynman technique',
    prompt: 0,
    answer:
      'Explain it plainly like to a beginner, see where you get stuck, go fill those gaps, then explain again.',
    covers: [T, T, T],
  },
  {
    concept: 'The Feynman technique',
    prompt: 0,
    answer: 'Explain it in simple words.',
    covers: [T, F, F],
  },
  {
    concept: 'The Feynman technique',
    prompt: 0,
    answer: 'Memorise the textbook definition word for word.',
    covers: [F, F, F],
  },
  {
    concept: 'The Feynman technique',
    prompt: 1,
    answer: "Jargon can cover up that you don't really get it.",
    covers: [T],
  },
  {
    concept: 'The Feynman technique',
    prompt: 1,
    answer: 'Using big words hides gaps in understanding.',
    covers: [T],
  },
  {
    concept: 'The Feynman technique',
    prompt: 1,
    answer: 'Because people find jargon rude.',
    covers: [F],
  },
  {
    concept: 'The Feynman technique',
    prompt: 2,
    answer:
      'Go back to the source for the bit I stumbled on, then explain it simply again.',
    covers: [T, T],
  },
  {
    concept: 'The Feynman technique',
    prompt: 2,
    answer: 'Reread the source.',
    covers: [T, F],
  },
  {
    concept: 'The Feynman technique',
    prompt: 2,
    answer: 'Just memorise the definition harder.',
    covers: [F, F],
  },
  // Red, green, refactor
  {
    concept: 'Red, green, refactor',
    prompt: 0,
    answer:
      'Write a failing test, write the least code to pass it, then clean up, and repeat.',
    covers: [T, T, T],
  },
  {
    concept: 'Red, green, refactor',
    prompt: 0,
    answer: 'Write the test first, then the code.',
    covers: [T, T, F],
  },
  {
    concept: 'Red, green, refactor',
    prompt: 0,
    answer: 'Write all the code, then write tests at the end.',
    covers: [F, F, F],
  },
  {
    concept: 'Red, green, refactor',
    prompt: 1,
    answer:
      'To prove the test can actually fail, so when it passes it means something.',
    covers: [T, T],
  },
  {
    concept: 'Red, green, refactor',
    prompt: 1,
    answer: 'To check the test can fail.',
    covers: [T, F],
  },
  {
    concept: 'Red, green, refactor',
    prompt: 1,
    answer: 'To make the build slower.',
    covers: [F, F],
  },
  // Bacteria and viruses
  {
    concept: 'Bacteria and viruses',
    prompt: 0,
    answer:
      'Bacteria are cells that reproduce by themselves; viruses can only copy inside a host cell.',
    covers: [T, T],
  },
  {
    concept: 'Bacteria and viruses',
    prompt: 0,
    answer: 'Viruses need a host to multiply.',
    covers: [F, T],
  },
  {
    concept: 'Bacteria and viruses',
    prompt: 0,
    answer: 'Viruses are bigger than bacteria.',
    covers: [F, F],
  },
  {
    concept: 'Bacteria and viruses',
    prompt: 1,
    answer:
      'Colds are caused by viruses and antibiotics only work on bacteria.',
    covers: [T, T],
  },
  {
    concept: 'Bacteria and viruses',
    prompt: 1,
    answer: "It's a virus.",
    covers: [T, F],
  },
  {
    concept: 'Bacteria and viruses',
    prompt: 1,
    answer: 'Because the dose is too small.',
    covers: [F, F],
  },
  // Interleaving and blocking
  {
    concept: 'Interleaving and blocking',
    prompt: 0,
    answer:
      'Blocked does one kind of problem at a time; interleaved mixes kinds so you have to pick the method.',
    covers: [T, T, T],
  },
  {
    concept: 'Interleaving and blocking',
    prompt: 0,
    answer: 'Interleaving mixes topics, blocking does one at a time.',
    covers: [T, T, F],
  },
  {
    concept: 'Interleaving and blocking',
    prompt: 0,
    answer: 'Blocking is studying with friends.',
    covers: [F, F, F],
  },
  {
    concept: 'Interleaving and blocking',
    prompt: 1,
    answer:
      'You have to choose the method every time, so it feels slow but transfers better.',
    covers: [T, T],
  },
  {
    concept: 'Interleaving and blocking',
    prompt: 1,
    answer: 'You choose the method each time.',
    covers: [T, F],
  },
  {
    concept: 'Interleaving and blocking',
    prompt: 1,
    answer: 'Because it is more fun.',
    covers: [F, F],
  },
  {
    concept: 'Interleaving and blocking',
    prompt: 2,
    answer:
      "Speed in a blocked session fades fast and doesn't show you can choose the method later.",
    covers: [T, T],
  },
  {
    concept: 'Interleaving and blocking',
    prompt: 2,
    answer: 'That speed is short-lived.',
    covers: [T, F],
  },
  {
    concept: 'Interleaving and blocking',
    prompt: 2,
    answer: 'Nothing is wrong with it.',
    covers: [F, F],
  },
];

/** Off-topic replies; each prompt also gets one of these, covering nothing. */
export const OFF_TOPIC = [
  "I don't remember.",
  'No idea, something about history?',
  'Pass.',
  'The mitochondria is the powerhouse of the cell.',
] as const;
