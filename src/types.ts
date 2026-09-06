export interface Fragment {
  id: string;
  text: string;
}

export interface Criterion {
  id: string;
  name: string;
  prompt: string;
  fragments: Fragment[];
}

export interface SelectedFeedback {
  fragmentId: string;
  text: string;
}

export interface Student {
  id: string;
  name: string;
  submission: string;
  personalNote: string;
  feedback: Record<string, SelectedFeedback[]>;
  completed: boolean;
  updatedAt: string;
}

export interface HistoryEvent {
  id: string;
  at: string;
  label: string;
}

export interface Bundle {
  id: string;
  title: string;
  className: string;
  criteria: Criterion[];
  students: Student[];
  createdAt: string;
  updatedAt: string;
  history: HistoryEvent[];
}

export const STARTER_CRITERIA: Criterion[] = [
  {
    id: 'ideas',
    name: 'Ideas & evidence',
    prompt: 'What is the writer saying, and how well is it supported?',
    fragments: [
      { id: 'ideas-focus', text: 'Your central idea is clear and sustained.' },
      { id: 'ideas-evidence', text: 'Choose one specific detail and explain how it supports your claim.' },
      { id: 'ideas-depth', text: 'Push this idea one step further by explaining why it matters.' }
    ]
  },
  {
    id: 'organization',
    name: 'Organization',
    prompt: 'Can a reader follow the thinking from beginning to end?',
    fragments: [
      { id: 'org-flow', text: 'The sequence helps the reader follow your thinking.' },
      { id: 'org-link', text: 'Add a transition that shows how these two ideas connect.' },
      { id: 'org-opening', text: 'Use the opening to establish the focus before adding detail.' }
    ]
  },
  {
    id: 'craft',
    name: 'Craft & clarity',
    prompt: 'How effectively do the sentences carry the writer’s meaning?',
    fragments: [
      { id: 'craft-voice', text: 'Your word choices give this piece a distinct voice.' },
      { id: 'craft-specific', text: 'Replace the general wording with a more precise image or action.' },
      { id: 'craft-sentence', text: 'Read this sentence aloud and revise where the meaning becomes hard to follow.' }
    ]
  },
  {
    id: 'conventions',
    name: 'Conventions',
    prompt: 'Which edit would most improve readability?',
    fragments: [
      { id: 'conv-control', text: 'Sentence boundaries and punctuation support easy reading.' },
      { id: 'conv-boundary', text: 'Check sentence boundaries, especially where two complete ideas meet.' },
      { id: 'conv-proof', text: 'A final proofread for spelling and punctuation will make your ideas easier to receive.' }
    ]
  }
];

export function newId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function createStudent(name = ''): Student {
  return {
    id: newId('student'),
    name,
    submission: '',
    personalNote: '',
    feedback: {},
    completed: false,
    updatedAt: new Date().toISOString()
  };
}

export function createBundle(title: string, className: string): Bundle {
  const now = new Date().toISOString();
  return {
    id: newId('bundle'),
    title: title.trim(),
    className: className.trim(),
    criteria: structuredClone(STARTER_CRITERIA),
    students: [createStudent()],
    createdAt: now,
    updatedAt: now,
    history: [{ id: newId('event'), at: now, label: 'Bundle created' }]
  };
}

/** A realistic completed bundle used only by the isolated try-it-out sandbox. */
export function createDemoBundle(): Bundle {
  const now = '2026-09-06T09:00:00.000Z';
  const criteria = structuredClone(STARTER_CRITERIA);
  const avery = createStudent('Avery Chen');
  avery.id = 'demo-student-avery';
  avery.submission = 'At the end of the platform, the station clock began to run backward. I watched the minute hand erase the wait.';
  avery.feedback = {
    ideas: [{ fragmentId: 'ideas-evidence', text: 'Choose the station clock detail and explain why its backward movement changes the scene.' }],
    organization: [{ fragmentId: 'org-flow', text: 'The shift from waiting to watching helps the reader follow your change in attention.' }]
  };
  avery.personalNote = 'The quiet station image stayed with me. Your restraint makes the strange moment believable.';
  avery.completed = true;
  avery.updatedAt = now;

  const miles = createStudent('Miles Rivera');
  miles.id = 'demo-student-miles';
  miles.submission = 'I found the old map in my grandmother’s desk and followed the faded river line after school.';
  miles.feedback = {
    craft: [{ fragmentId: 'craft-specific', text: 'Replace “after school” with one concrete detail that lets us see the start of the search.' }]
  };
  miles.personalNote = 'Your map gives the piece a clear sense of possibility. I want to know what you noticed first.';
  miles.updatedAt = now;

  const noor = createStudent('Noor Patel');
  noor.id = 'demo-student-noor';
  noor.submission = 'When the power returned, every porch on the block lit up at once, and the rain looked silver.';
  noor.feedback = {
    conventions: [{ fragmentId: 'conv-control', text: 'Sentence boundaries and punctuation support easy reading.' }]
  };
  noor.personalNote = 'The silver rain image gives your ending a satisfying lift.';
  noor.updatedAt = now;

  return {
    id: 'demo-bundle-flash-fiction',
    title: 'Flash fiction: a turn at the station',
    className: 'Grade 9 writing workshop',
    criteria,
    students: [avery, miles, noor],
    createdAt: now,
    updatedAt: now,
    history: [
      { id: 'demo-event-finished', at: now, label: 'Feedback finished for Avery Chen' },
      { id: 'demo-event-created', at: now, label: 'Sample bundle created' }
    ]
  };
}
