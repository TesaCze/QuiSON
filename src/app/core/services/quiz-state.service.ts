import { Injectable, signal, computed } from '@angular/core';
import {
  Question, QuizAnswer, QuizConfig,
  HistoryEntry, NavView, ResultFilter
} from '../models/quiz.model';
import { FirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
export class QuizStateService {
  currentView = signal<NavView>('home');
  questions = signal<Question[]>([]);
  quizConfig   = signal<QuizConfig | null>(null);
  quizQuestions = signal<Question[]>([]);
  quizIndex    = signal(0);
  quizAnswers  = signal<QuizAnswer[]>([]);
  quizStartTime = signal<number>(0);
  resultElapsed = signal(0);
  resultFilter  = signal<ResultFilter>('all');
  history = signal<HistoryEntry[]>(this.loadHistory());

  constructor(private firebaseService: FirebaseService) {}

  currentQuestion = computed(() =>
    this.quizQuestions()[this.quizIndex()]
  );

  progressPct = computed(() =>
    this.quizQuestions().length
      ? (this.quizIndex() / this.quizQuestions().length) * 100
      : 0
  );

  quizResults = computed(() => {
    const answers = this.quizAnswers();
    const correct = answers.filter(a => !a.skipped && a.selected === a.correct).length;
    const wrong   = answers.filter(a => !a.skipped && a.selected !== a.correct).length;
    const skipped = answers.filter(a => a.skipped).length;
    const total   = answers.length;
    const pct     = total > 0 ? Math.round((correct / total) * 100) : 0;
    return { correct, wrong, skipped, total, pct };
  });

  filteredAnswers = computed(() => {
    const answers = this.quizAnswers();
    const f = this.resultFilter();
    if (f === 'correct') return answers.filter(a => !a.skipped && a.selected === a.correct);
    if (f === 'wrong')   return answers.filter(a => !a.skipped && a.selected !== a.correct);
    if (f === 'skip')    return answers.filter(a => a.skipped);
    return answers;
  });

  navigate(view: NavView) {
    this.currentView.set(view);
  }

  setQuestions(qs: Question[]) {
    this.questions.set(qs);
  }

  addQuestion(q: Question) {
    this.questions.update(qs => [...qs, q]);
  }

  removeQuestion(index: number) {
    this.questions.update(qs => qs.filter((_, i) => i !== index));
  }

  clearQuestions() {
    this.questions.set([]);
  }

  startQuiz(config: QuizConfig) {
    let pool = [...config.questions];
    if (config.shuffle) pool = pool.sort(() => Math.random() - 0.5);
    const subset = pool.slice(0, config.count);

    this.quizConfig.set(config);
    this.quizQuestions.set(subset);
    this.quizIndex.set(0);
    this.quizAnswers.set([]);
    this.quizStartTime.set(Date.now());
    this.navigate('quiz');
  }

  answerQuestion(selected: string) {
    const q = this.currentQuestion();
    if (!q) return;
    const answer: QuizAnswer = {
      questionId: q.id,
      question: q.question,
      options: q.options,
      selected,
      correct: q.correct,
      skipped: false,
    };
    this.quizAnswers.update(a => [...a, answer]);
  }

  skipQuestion() {
    const q = this.currentQuestion();
    if (!q) return;
    const answer: QuizAnswer = {
      questionId: q.id,
      question: q.question,
      options: q.options,
      selected: null,
      correct: q.correct,
      skipped: true,
    };
    this.quizAnswers.update(a => [...a, answer]);
  }

  advance() {
    const next = this.quizIndex() + 1;
    if (next >= this.quizQuestions().length) {
      this.finishQuiz();
    } else {
      this.quizIndex.set(next);
    }
  }

  finishQuiz() {
    const elapsed = Math.floor((Date.now() - this.quizStartTime()) / 1000);
    this.resultElapsed.set(elapsed);
    this.saveToHistory(elapsed);
    this.navigate('results');
  }

  saveToHistory(elapsed: number) {
    const r = this.quizResults();
    const entry: HistoryEntry = {
      id: Date.now(),
      name: this.quizConfig()?.name ?? 'Kvíz',
      date: new Date().toISOString(),
      total: r.total,
      correct: r.correct,
      wrong: r.wrong,
      skipped: r.skipped,
      pct: r.pct,
      elapsed,
      answers: this.quizAnswers(),
    };
    const updated = [entry, ...this.history()].slice(0, 50);
    this.history.set(updated);
    localStorage.setItem('quison_history', JSON.stringify(updated));
    if (this.firebaseService.getCurrentUser()) {
      this.firebaseService.saveUserHistory(updated).catch(console.error);
    }
  }

  async loadHistoryFromFirebase() {
    if (this.firebaseService.getCurrentUser()) {
      try {
        const firebaseHistory = await this.firebaseService.loadUserHistory();
        if (firebaseHistory.length > 0) {
          this.history.set(firebaseHistory as HistoryEntry[]);
          localStorage.setItem('quison_history', JSON.stringify(firebaseHistory));
        }
      } catch (error) {
        console.error('Failed to load history from Firebase:', error);
      }
    }
  }

  clearHistory() {
    this.history.set([]);
    localStorage.removeItem('quison_history');
    if (this.firebaseService.getCurrentUser()) {
      this.firebaseService.saveUserHistory([]).catch(console.error);
    }
  }

  async saveQuizConfig(name: string) {
    if (!this.firebaseService.getCurrentUser()) throw new Error('User not authenticated');
    const config = {
      name,
      questions: this.questions(),
      count: this.questions().length,
      shuffle: false
    };
    return this.firebaseService.saveQuizConfig(name, config);
  }

  async loadQuizConfigs() {
    if (!this.firebaseService.getCurrentUser()) throw new Error('User not authenticated');
    return this.firebaseService.loadQuizConfigs();
  }

  async deleteQuizConfig(configId: string) {
    if (!this.firebaseService.getCurrentUser()) throw new Error('User not authenticated');
    return this.firebaseService.deleteQuizConfig(configId);
  }

  async loadQuizConfig(config: any) {
    this.questions.set(config.questions);
  }

  private loadHistory(): HistoryEntry[] {
    try {
      return JSON.parse(localStorage.getItem('quison_history') ?? '[]');
    } catch {
      return [];
    }
  }
}
