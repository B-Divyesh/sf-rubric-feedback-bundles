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
