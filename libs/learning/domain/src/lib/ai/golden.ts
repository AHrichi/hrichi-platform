import type { ConceptType } from '../records';
import type { ExplainedConcept } from './tasks';

/**
 * Hand-written concepts, two per concept type, that pass every check with
 * no issues (design §6.2). They are the checks' ground truth, the prompts'
 * examples, the Jev spike's labelled set and, later, the demo's content.
 */
export interface GoldenConcept {
  title: string;
  type: ConceptType;
  topic: string;
  span: string;
  explained: ExplainedConcept;
}

export const GOLDEN_CONCEPTS: readonly GoldenConcept[] = [
  {
    title: 'Opportunity cost',
    type: 'definition',
    topic: 'Economics',
    span: 'Opportunity cost is the value of the next best alternative you give up when you make a choice.',
    explained: {
      essence:
        'The value of the best option you give up when you choose another.',
      simple:
        'Every choice closes other doors. Opportunity cost is the value of the best door you closed. If you spend Saturday studying, the opportunity cost is the next best thing you would have done, like working a paid shift or resting.',
      analogy:
        'It is like choosing pizza at a food court: the cost is not only the price, it is the burger you did not get.',
      misconception:
        'People add up every option they gave up. Opportunity cost is only the single best one.',
      prompts: [
        {
          type: 'free_recall',
          question: 'Explain opportunity cost in your own words.',
          answer:
            'The value of the next best alternative you give up when you choose.',
          options: null,
          keyPoints: [
            'the next best alternative',
            'given up by making a choice',
          ],
        },
        {
          type: 'apply',
          question:
            'You turn down a $200 shift to attend a free workshop. What is the opportunity cost of the workshop?',
          answer:
            'The $200 you would have earned at the shift, the best alternative you gave up.',
          options: null,
          keyPoints: [
            'the $200 from the shift',
            'the best alternative given up',
          ],
        },
        {
          type: 'spot_error',
          question:
            "Find the mistake: 'The opportunity cost of university is every job you could have had instead.'",
          answer: 'It is only the single best job given up, not all of them.',
          options: null,
          keyPoints: [
            'only the best alternative counts',
            'not the sum of every option',
          ],
        },
        {
          type: 'quick_fire',
          question: 'Opportunity cost counts…',
          answer: 'only the best option you gave up',
          options: [
            'every option you gave up',
            'only the best option you gave up',
            'only the money you spent',
          ],
          keyPoints: [],
        },
      ],
      uncertain: false,
    },
  },
  {
    title: 'Retrieval practice',
    type: 'definition',
    topic: 'Learning science',
    span: 'Retrieval practice means pulling information out of memory, for example by answering questions, instead of re-reading it.',
    explained: {
      essence:
        'Recalling something from memory strengthens it more than reading it again.',
      simple:
        'Each time you pull an idea out of memory, the path to it gets stronger. Rereading feels productive but asks little of memory. Testing yourself, even when you get it wrong, makes the idea easier to recall next time.',
      analogy:
        'It is like a path through grass: walking it keeps it open, looking at a map of it does not.',
      misconception:
        'Many people think tests only measure learning. Testing yourself is one of the best ways to learn.',
      prompts: [
        {
          type: 'free_recall',
          question: 'What is retrieval practice, and why does it work?',
          answer:
            'Pulling information out of memory; each recall strengthens the memory more than rereading.',
          options: null,
          keyPoints: [
            'recalling from memory',
            'strengthens memory more than rereading',
          ],
        },
        {
          type: 'why',
          question: 'Why does a failed attempt to recall still help?',
          answer:
            'The effort of searching memory primes it, so the correct answer you see next is stored more strongly.',
          options: null,
          keyPoints: [
            'the effort of searching memory',
            'makes the correct answer stick',
          ],
        },
        {
          type: 'cloze',
          question: 'Testing yourself from memory is called ____ practice.',
          answer: 'retrieval',
          options: null,
          keyPoints: [],
        },
      ],
      uncertain: false,
    },
  },
  {
    title: 'Photosynthesis',
    type: 'process',
    topic: 'Biology',
    span: 'Plants use light energy to turn carbon dioxide and water into glucose and oxygen in their chloroplasts.',
    explained: {
      essence:
        'Plants use sunlight to turn carbon dioxide and water into sugar and oxygen.',
      simple:
        'Inside leaves, chloroplasts catch sunlight. They use that energy to take carbon dioxide from the air and water from the roots and build glucose, a sugar the plant uses to live and grow. Oxygen is left over and released.',
      analogy:
        'It is like a solar-powered kitchen that takes air and water and bakes sugar, with oxygen as the steam.',
      misconception:
        'People often think plants get their mass from the soil. Most of it comes from carbon dioxide in the air.',
      prompts: [
        {
          type: 'free_recall',
          question: 'Describe what happens in photosynthesis.',
          answer:
            'Chloroplasts use light energy to turn carbon dioxide and water into glucose, releasing oxygen.',
          options: null,
          keyPoints: [
            'light energy',
            'carbon dioxide and water go in',
            'glucose and oxygen come out',
          ],
        },
        {
          type: 'why',
          question: 'Why do plants release oxygen?',
          answer:
            'Oxygen is left over when water is split to build glucose with carbon dioxide.',
          options: null,
          keyPoints: ['a by-product', 'from splitting water'],
        },
        {
          type: 'spot_error',
          question:
            "Find the mistake: 'A tree builds its trunk mostly from minerals in the soil.'",
          answer:
            "Most of a tree's mass comes from carbon dioxide taken from the air.",
          options: null,
          keyPoints: [
            'mass comes from carbon dioxide',
            'from the air, not the soil',
          ],
        },
      ],
      uncertain: false,
    },
  },
  {
    title: 'Binary search',
    type: 'process',
    topic: 'Programming',
    span: 'Binary search finds an item in a sorted list by repeatedly halving the range it searches.',
    explained: {
      essence:
        'Find an item in a sorted list by halving the search range at each step.',
      simple:
        'Look at the middle item. If it is the one you want, stop. If what you want is smaller, keep only the left half; if bigger, the right half. Repeat. Each step halves what is left, so a million items need about 20 checks.',
      analogy:
        'It is like finding a word in a dictionary by opening it in the middle and ignoring the half it cannot be in.',
      misconception:
        'People apply it to unsorted lists. Without sorted order, dropping a half can throw the answer away.',
      prompts: [
        {
          type: 'free_recall',
          question: 'How does binary search work?',
          answer:
            'Check the middle of a sorted range, then keep only the half that can hold the target; repeat.',
          options: null,
          keyPoints: [
            'the list is sorted',
            'compare with the middle',
            'discard half each step',
          ],
        },
        {
          type: 'apply',
          question:
            'About how many checks does binary search need for 1,000 sorted items?',
          answer: 'About 10, because halving 1,000 ten times leaves one item.',
          options: null,
          keyPoints: ['about 10 checks', 'each check halves the range'],
        },
        {
          type: 'quick_fire',
          question: 'Binary search only works when the list is…',
          answer: 'sorted',
          options: ['sorted', 'short', 'free of duplicates'],
          keyPoints: [],
        },
      ],
      uncertain: false,
    },
  },
  {
    title: 'Interest rates and inflation',
    type: 'cause_effect',
    topic: 'Economics',
    span: 'When central banks raise interest rates, borrowing gets more expensive, spending slows and inflation tends to fall.',
    explained: {
      essence:
        'Higher interest rates make borrowing costly, which slows spending and cools inflation.',
      simple:
        'Interest is the price of borrowing. When the central bank raises it, loans and mortgages cost more, so people and firms borrow and spend less. With less demand chasing the same goods, prices rise more slowly.',
      analogy:
        'It is like turning down the heat under a pot: the boiling slows, but not instantly.',
      misconception:
        'People expect prices to fall at once. Rate rises act over months, and they slow price growth rather than reverse it.',
      prompts: [
        {
          type: 'free_recall',
          question: 'How do higher interest rates bring inflation down?',
          answer:
            'Borrowing costs more, so spending falls, and lower demand slows price rises.',
          options: null,
          keyPoints: [
            'borrowing costs more',
            'spending falls',
            'lower demand slows prices',
          ],
        },
        {
          type: 'why',
          question: 'Why does a rate rise take months to affect inflation?',
          answer:
            'Loans, contracts and spending plans adjust gradually, so demand falls slowly.',
          options: null,
          keyPoints: [
            'existing loans and contracts',
            'demand adjusts gradually',
          ],
        },
        {
          type: 'cloze',
          question: 'Raising interest rates makes ____ more expensive.',
          answer: 'borrowing',
          options: null,
          keyPoints: [],
        },
      ],
      uncertain: false,
    },
  },
  {
    title: 'The spacing effect',
    type: 'cause_effect',
    topic: 'Learning science',
    span: 'Spreading study sessions out over time leads to better long-term memory than cramming the same time into one session.',
    explained: {
      essence:
        'Studying in spaced sessions beats cramming for long-term memory.',
      simple:
        'If you review something after a gap, you have partly forgotten it, so recalling it takes effort. That effort strengthens the memory more than repeating it while it is fresh. The same hours, spread out, last much longer.',
      analogy:
        'It is like watering a plant a little every few days instead of flooding it once.',
      misconception:
        'Cramming feels effective because recall is easy straight away. It fades fast; spacing feels harder and lasts.',
      prompts: [
        {
          type: 'free_recall',
          question: 'What is the spacing effect?',
          answer:
            'Spreading study over time gives better long-term memory than cramming the same time.',
          options: null,
          keyPoints: [
            'spread over time',
            'better long-term memory',
            'than cramming',
          ],
        },
        {
          type: 'why',
          question: 'Why does a gap before reviewing help?',
          answer:
            'Partial forgetting makes recall effortful, and effortful recall strengthens memory more.',
          options: null,
          keyPoints: [
            'partial forgetting',
            'effortful recall strengthens memory',
          ],
        },
        {
          type: 'apply',
          question:
            'You have 3 hours to prepare for an exam in two weeks. How should you use them?',
          answer:
            'Split them into several shorter sessions spread over the two weeks.',
          options: null,
          keyPoints: ['several shorter sessions', 'spread over the two weeks'],
        },
      ],
      uncertain: false,
    },
  },
  {
    title: "Gutenberg's printing press",
    type: 'fact',
    topic: 'History',
    span: "Johannes Gutenberg's printing press, around 1440, used movable metal type and made books far cheaper to produce.",
    explained: {
      essence:
        "Around 1440 Gutenberg's movable-type press made books cheap to produce.",
      simple:
        'Before the press, books were copied by hand, so they were rare and expensive. Gutenberg cast letters in metal that could be rearranged and reused, so a page could be printed many times quickly. Books and ideas spread fast.',
      analogy:
        'It is like going from hand-drawing every copy of a poster to using a stamp.',
      misconception:
        'Gutenberg did not invent printing itself; woodblock and movable-type printing existed earlier in East Asia.',
      prompts: [
        {
          type: 'free_recall',
          question: "What did Gutenberg's printing press change, and when?",
          answer:
            'Around 1440, movable metal type made books cheap and fast to produce.',
          options: null,
          keyPoints: [
            'around 1440',
            'movable metal type',
            'books became cheap',
          ],
        },
        {
          type: 'quick_fire',
          question: "Gutenberg's press appeared around the year…",
          answer: '1440',
          options: ['1240', '1440', '1640'],
          keyPoints: [],
        },
        {
          type: 'spot_error',
          question:
            "Find the mistake: 'Gutenberg invented the first printing of any kind.'",
          answer:
            "Printing, even with movable type, existed earlier in East Asia; Gutenberg's metal-type press made it cheap in Europe.",
          options: null,
          keyPoints: [
            'printing existed earlier in East Asia',
            'his press made it cheap and fast',
          ],
        },
      ],
      uncertain: false,
    },
  },
  {
    title: 'Speed of light',
    type: 'fact',
    topic: 'Physics',
    span: 'Light travels through a vacuum at about 300,000 kilometres per second.',
    explained: {
      essence:
        'In a vacuum, light travels about 300,000 kilometres every second.',
      simple:
        'Nothing we know travels faster than light in empty space. At about 300,000 kilometres per second it could circle the Earth more than seven times in one second, and sunlight takes about eight minutes to reach us.',
      analogy:
        "It is like a runner who could lap the Earth seven times before you finish saying 'go'.",
      misconception:
        'People think light always moves at this speed. It slows down in water or glass.',
      prompts: [
        {
          type: 'free_recall',
          question: 'How fast does light travel in a vacuum?',
          answer: 'About 300,000 kilometres per second.',
          options: null,
          keyPoints: ['about 300,000 kilometres per second', 'in a vacuum'],
        },
        {
          type: 'apply',
          question: 'About how long does sunlight take to reach Earth?',
          answer: 'About eight minutes.',
          options: null,
          keyPoints: ['about eight minutes'],
        },
        {
          type: 'cloze',
          question:
            'In a vacuum, light travels about ____ kilometres per second.',
          answer: '300,000',
          options: null,
          keyPoints: [],
        },
      ],
      uncertain: false,
    },
  },
  {
    title: 'The Feynman technique',
    type: 'skill',
    topic: 'Learning science',
    span: 'To check you understand something, explain it in plain words as if teaching a beginner, and note where you get stuck.',
    explained: {
      essence:
        'Explain an idea simply, as if to a beginner, to find gaps in your understanding.',
      simple:
        'Pick an idea and explain it in plain words, as if to a curious 12-year-old. Wherever you reach for jargon or get stuck, you have found a gap. Go back to the source, fill it, and explain again.',
      analogy:
        'It is like testing a bridge by pushing a heavy cart across it: the weak planks show up fast.',
      misconception:
        'It is not about simplifying for others. It is a test of your own understanding.',
      prompts: [
        {
          type: 'free_recall',
          question: 'What are the steps of the Feynman technique?',
          answer:
            'Explain the idea in plain words to a beginner, notice where you get stuck, study those gaps, explain again.',
          options: null,
          keyPoints: [
            'explain in plain words',
            'notice where you get stuck',
            'fill the gaps and repeat',
          ],
        },
        {
          type: 'why',
          question: 'Why is reaching for jargon a warning sign?',
          answer:
            "Jargon can hide that you don't understand the idea underneath it.",
          options: null,
          keyPoints: ['jargon hides missing understanding'],
        },
        {
          type: 'apply',
          question:
            'You can recite a definition but stumble explaining it to a friend. What should you do next?',
          answer:
            'Go back to the source for the part you stumbled on, then explain it again simply.',
          options: null,
          keyPoints: ['return to the source', 'explain it again simply'],
        },
      ],
      uncertain: false,
    },
  },
  {
    title: 'Red, green, refactor',
    type: 'skill',
    topic: 'Programming',
    span: 'In test-driven development you write a test that fails, write just enough code to pass it, then refactor.',
    explained: {
      essence:
        'Write a failing test, make it pass with minimal code, then tidy up.',
      simple:
        'First write a small test for behaviour that does not exist yet and watch it fail, so you know it can catch a bug. Then write just enough code to pass it. Finally clean the code up while the test keeps you safe.',
      analogy:
        'It is like setting the target before you throw: you know when you hit it.',
      misconception:
        'Test-driven development is not writing every test up front. It is one small test at a time, in a loop.',
      prompts: [
        {
          type: 'free_recall',
          question: 'Describe the test-driven development loop.',
          answer:
            'Write a failing test, write the least code to pass it, then refactor; repeat.',
          options: null,
          keyPoints: [
            'a failing test first',
            'minimal code to pass',
            'then refactor',
          ],
        },
        {
          type: 'why',
          question: 'Why watch a new test fail before writing the code?',
          answer:
            'It proves the test can detect the missing behaviour, so a pass means something.',
          options: null,
          keyPoints: ['proves the test can fail', 'so a pass is meaningful'],
        },
        {
          type: 'quick_fire',
          question: 'The three steps of test-driven development are…',
          answer: 'red, green, refactor',
          options: [
            'red, green, refactor',
            'plan, build, ship',
            'write, run, deploy',
          ],
          keyPoints: [],
        },
      ],
      uncertain: false,
    },
  },
  {
    title: 'Bacteria and viruses',
    type: 'comparison',
    topic: 'Biology',
    span: 'Bacteria are living single cells that can reproduce on their own; viruses are much smaller and can only reproduce inside a host cell.',
    explained: {
      essence:
        'Bacteria are self-reproducing cells; viruses need a host cell to copy themselves.',
      simple:
        'A bacterium is a complete living cell: it feeds, grows and divides by itself. A virus is genetic material in a protein coat, far smaller, and does nothing until it gets inside a cell and hijacks it to make copies.',
      analogy:
        'A bacterium is a tiny factory; a virus is a set of blueprints that takes over someone else’s factory.',
      misconception:
        'Antibiotics do not work on viruses. They attack bacterial cell parts that viruses do not have.',
      prompts: [
        {
          type: 'free_recall',
          question: 'What is the main difference between bacteria and viruses?',
          answer:
            'Bacteria are living cells that reproduce on their own; viruses can only reproduce inside a host cell.',
          options: null,
          keyPoints: [
            'bacteria reproduce on their own',
            'viruses need a host cell',
          ],
        },
        {
          type: 'why',
          question: "Why don't antibiotics cure a cold?",
          answer:
            'Colds are caused by viruses, and antibiotics attack bacterial structures viruses lack.',
          options: null,
          keyPoints: ['colds are viral', 'antibiotics target bacteria'],
        },
        {
          type: 'quick_fire',
          question: 'Which can reproduce without a host cell?',
          answer: 'bacteria',
          options: ['bacteria', 'viruses', 'both'],
          keyPoints: [],
        },
      ],
      uncertain: false,
    },
  },
  {
    title: 'Interleaving and blocking',
    type: 'comparison',
    topic: 'Learning science',
    span: 'Blocked practice repeats one type of problem at a time; interleaved practice mixes types, which feels harder but improves the ability to choose the right method.',
    explained: {
      essence:
        'Mixing problem types beats practising one type at a time for choosing the right method.',
      simple:
        'Blocking means doing ten problems of the same kind in a row, so you already know which method to use. Interleaving mixes kinds, so each problem first asks you to decide which method fits. Exams demand that decision, so interleaving transfers better.',
      analogy:
        'Blocking is practising one tennis shot again and again; interleaving is a real rally where you pick each shot.',
      misconception:
        'Blocked practice feels better because you speed up within the session, but that speed fades and does not transfer.',
      prompts: [
        {
          type: 'free_recall',
          question: 'How do interleaved and blocked practice differ?',
          answer:
            'Blocked practice repeats one type at a time; interleaved practice mixes types so you choose the method each time.',
          options: null,
          keyPoints: [
            'blocked: one type at a time',
            'interleaved: mixed types',
            'you must choose the method',
          ],
        },
        {
          type: 'why',
          question: 'Why does interleaving feel harder yet work better?',
          answer:
            'Each problem makes you pick the right method, the skill exams need, so learning sticks even though progress feels slower.',
          options: null,
          keyPoints: [
            'you pick the method each time',
            'feels slower but transfers better',
          ],
        },
        {
          type: 'spot_error',
          question:
            "Find the mistake: 'If you get faster during blocked practice, you have learned the method for good.'",
          answer:
            'Speed within a blocked session is short-lived and does not show you can choose the method later.',
          options: null,
          keyPoints: [
            'in-session speed is short-lived',
            'it does not show you can choose the method',
          ],
        },
      ],
      uncertain: false,
    },
  },
];
