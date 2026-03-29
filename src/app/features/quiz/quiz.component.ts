import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuizStateService } from '../../core/services/quiz-state.service';
import { TimerService } from '../../core/services/timer.service';
import { ModalComponent } from '../../shared/components/modal.component';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  template: `
    <div class="animate-fade-up">

      <div class="flex items-center gap-4 mb-6 flex-wrap">
        <span class="font-mono text-sm text-muted whitespace-nowrap">
          {{ state.quizIndex() + 1 }} / {{ state.quizQuestions().length }}
        </span>
        <div class="flex-1 h-1 bg-border rounded-full overflow-hidden min-w-[80px]">
          <div
            class="h-full bg-accent transition-all duration-300 rounded-full"
            [style.width.%]="state.progressPct()"
          ></div>
        </div>

        @if (timer.active()) {
          <span [class]="timerClass()">
            ⏱ {{ timer.display() }}
          </span>
        }

        <button class="btn btn-ghost btn-sm" (click)="showAbort = true">✕ Ukončit</button>
      </div>

      @if (state.currentQuestion(); as q) {
        <div class="card animate-fade-up">
          <div class="font-mono text-[11px] text-muted mb-2 uppercase tracking-wide">
            Otázka {{ state.quizIndex() + 1 }}
          </div>
          <p class="text-base font-medium leading-relaxed mb-6">{{ q.question }}</p>

          <div class="flex flex-col gap-2.5">
            @for (entry of optionEntries(q.options); track entry.key) {
              <button
                class="option-btn"
                [class.selected]="!answered() && selectedKey() === entry.key"
                [class.revealed-correct]="answered() && entry.key === q.correct"
                [class.revealed-wrong]="answered() && selectedKey() === entry.key && entry.key !== q.correct"
                [disabled]="answered()"
                (click)="selectOption(entry.key)"
              >
                <span
                  class="opt-letter"
                  [class.!bg-accent]="!answered() && selectedKey() === entry.key"
                  [class.!text-white]="!answered() && selectedKey() === entry.key"
                  [class.!bg-correct]="answered() && entry.key === q.correct"
                  [class.!bg-wrong]="answered() && selectedKey() === entry.key && entry.key !== q.correct"
                >{{ entry.key }}</span>
                <span class="text-sm">{{ entry.value }}</span>
              </button>
            }
          </div>

          @if (answered()) {
            <div
              class="mt-4 px-4 py-3 rounded-xl text-sm font-medium animate-fade-up"
              [class.bg-correct-bg]="isCorrect()"
              [class.text-correct]="isCorrect()"
              [class.bg-wrong-bg]="!isCorrect()"
              [class.text-wrong]="!isCorrect()"
            >
              @if (isCorrect()) {
                ✓ Správně!
              } @else {
                ✗ {{ skipped() ? 'Přeskočeno.' : 'Špatně.' }}
                Správná odpověď: <strong>{{ q.correct }}) {{ q.options[q.correct] }}</strong>
              }
            </div>
          }

          <div class="flex justify-between items-center mt-6 flex-wrap gap-3">
            @if (!answered()) {
              <button class="btn btn-ghost btn-sm" (click)="skip()">Přeskočit →</button>
            } @else {
              <div></div>
            }
            <button
              class="btn btn-primary"
              [disabled]="!answered()"
              (click)="next()"
            >
              {{ isLast() ? 'Zobrazit výsledky' : 'Další →' }}
            </button>
          </div>
        </div>
      }
    </div>

    <app-modal [open]="showAbort" (closed)="showAbort = false">
      <h3 class="text-lg font-semibold mb-2">Ukončit kvíz?</h3>
      <p class="text-sm text-muted">Dosavadní odpovědi budou uloženy a zobrazí se výsledky.</p>
      <div class="flex justify-end gap-3 mt-6">
        <button class="btn btn-ghost" (click)="showAbort = false">Pokračovat</button>
        <button class="btn btn-danger" (click)="abort()">Ukončit</button>
      </div>
    </app-modal>
  `,
})
export class QuizComponent implements OnInit, OnDestroy {
  state  = inject(QuizStateService);
  timer  = inject(TimerService);

  showAbort = false;
  selectedKey = signal<string | null>(null);
  answered    = signal(false);
  skipped     = signal(false);

  ngOnInit() {
    const limit = this.state.quizConfig()?.timeLimitSeconds ?? 0;
    this.timer.start(limit, () => this.state.finishQuiz());
  }

  ngOnDestroy() {
    this.timer.stop();
  }

  optionEntries(options: Record<string, string>) {
    return Object.entries(options).map(([key, value]) => ({ key, value }));
  }

  selectOption(key: string) {
    if (this.answered()) return;
    this.selectedKey.set(key);
    this.answered.set(true);
    this.skipped.set(false);
    this.state.answerQuestion(key);
  }

  skip() {
    this.skipped.set(true);
    this.answered.set(true);
    this.selectedKey.set(null);
    this.state.skipQuestion();
  }

  next() {
    this.selectedKey.set(null);
    this.answered.set(false);
    this.skipped.set(false);
    this.state.advance();
  }

  abort() {
    this.showAbort = false;
    this.timer.stop();
    this.state.finishQuiz();
  }

  isCorrect(): boolean {
    const q = this.state.currentQuestion();
    return !this.skipped() && this.selectedKey() === q?.correct;
  }

  isLast(): boolean {
    return this.state.quizIndex() === this.state.quizQuestions().length - 1;
  }

  timerClass(): string {
    const s = this.timer.state();
    if (s === 'danger') return 'timer-danger';
    if (s === 'warn')   return 'timer-warn';
    return 'timer-normal';
  }
}
