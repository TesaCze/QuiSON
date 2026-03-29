export interface Question {
  id: number;
  question: string;
  options: Record<'A' | 'B' | 'C' | 'D', string>;
  correct: 'A' | 'B' | 'C' | 'D';
}

export interface QuizAnswer {
  questionId: number;
  question: string;
  options: Record<string, string>;
  selected: string | null;
  correct: string;
  skipped: boolean;
}

export interface QuizConfig {
  name: string;
  questions: Question[];
  timeLimitSeconds: number;
  shuffle: boolean;
  count: number;
}

export interface HistoryEntry {
  id: number;
  name: string;
  date: string;
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  pct: number;
  elapsed: number;
  answers: QuizAnswer[];
}

export type ResultFilter = 'all' | 'correct' | 'wrong' | 'skip';
export type NavView = 'home' | 'builder' | 'quiz' | 'results' | 'history';
