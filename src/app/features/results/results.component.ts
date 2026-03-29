import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuizStateService } from '../../core/services/quiz-state.service';
import { FormatTimePipe } from '../../shared/pipes/format-time.pipe';
import { StartModalComponent } from '../quiz/start-modal.component';
import { ResultFilter } from '../../core/models/quiz.model';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [CommonModule, FormatTimePipe, StartModalComponent],
  template: `
    <div class="animate-fade-up">
      <h2 class="text-xl font-semibold">Výsledky</h2>
      <p class="text-sm text-muted mt-1 mb-6">
        {{ state.quizConfig()?.name }} · {{ today() }}
      </p>

      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div class="card text-center !p-5">
          <div class="font-mono text-3xl font-medium text-accent">{{ state.quizResults().pct }}%</div>
          <div class="text-xs text-muted mt-1">Úspěšnost</div>
        </div>
        <div class="card text-center !p-5">
          <div class="font-mono text-3xl font-medium text-correct">{{ state.quizResults().correct }}</div>
          <div class="text-xs text-muted mt-1">Správně</div>
        </div>
        <div class="card text-center !p-5">
          <div class="font-mono text-3xl font-medium text-wrong">{{ state.quizResults().wrong }}</div>
          <div class="text-xs text-muted mt-1">Špatně</div>
        </div>
        <div class="card text-center !p-5">
          <div class="font-mono text-3xl font-medium text-muted">{{ state.quizResults().skipped }}</div>
          <div class="text-xs text-muted mt-1">Přeskočeno</div>
        </div>
        <div class="card text-center !p-5">
          <div class="font-mono text-3xl font-medium text-[#1a1917]">{{ state.resultElapsed() | formatTime }}</div>
          <div class="text-xs text-muted mt-1">Čas</div>
        </div>
      </div>


      <div class="card mb-6">
        <div class="flex items-center gap-3 mb-5 flex-wrap">
          <h3 class="text-base font-semibold">Přehled odpovědí</h3>
          <div class="ml-auto flex gap-2 flex-wrap">
            @for (f of filters; track f.key) {
              <button
                class="btn btn-sm"
                [class.btn-primary]="state.resultFilter() === f.key"
                [class.btn-ghost]="state.resultFilter() !== f.key"
                (click)="state.resultFilter.set(f.key)"
              >{{ f.label }}</button>
            }
          </div>
        </div>

        @if (state.filteredAnswers().length === 0) {
          <div class="text-center py-10 text-muted text-sm">Žádné výsledky pro tento filtr.</div>
        } @else {
          <div class="space-y-2.5">
            @for (a of state.filteredAnswers(); track a.questionId) {
              <div
                class="result-item"
                [class.r-correct]="!a.skipped && a.selected === a.correct"
                [class.r-wrong]="!a.skipped && a.selected !== a.correct"
                [class.r-skip]="a.skipped"
              >
                <span class="text-lg flex-shrink-0 mt-0.5">
                  {{ a.skipped ? '→' : a.selected === a.correct ? '✓' : '✗' }}
                </span>
                <div class="min-w-0">
                  <p class="font-medium text-sm mb-1.5 leading-snug">{{ a.question }}</p>
                  <p class="text-xs text-muted leading-relaxed">
                    @if (a.skipped) {
                      Přeskočeno ·
                      Správně: <span class="font-mono">{{ a.correct }}) {{ a.options[a.correct] }}</span>
                    } @else if (a.selected === a.correct) {
                      Správně: <span class="font-mono">{{ a.correct }}) {{ a.options[a.correct] }}</span>
                    } @else {
                      Tvoje odpověď: <span class="font-mono">{{ a.selected }}) {{ a.options[a.selected!] }}</span>
                      · Správně: <span class="font-mono">{{ a.correct }}) {{ a.options[a.correct] }}</span>
                    }
                  </p>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <div class="flex flex-wrap gap-3">
        <button class="btn btn-primary" (click)="retry()">🔄 Zkusit znovu</button>
        <button class="btn btn-ghost" (click)="state.navigate('home')">🏠 Domů</button>
        <button class="btn btn-ghost" (click)="state.navigate('history')">📊 Historie</button>
      </div>
    </div>

    <app-start-modal
      [open]="showRetry"
      [questions]="state.quizConfig()?.questions ?? []"
      [defaultName]="state.quizConfig()?.name ?? 'Kvíz'"
      (closed)="showRetry = false"
    />
  `,
})
export class ResultsComponent {
  state = inject(QuizStateService);
  showRetry = false;

  filters: { key: ResultFilter; label: string }[] = [
    { key: 'all',     label: 'Vše' },
    { key: 'correct', label: '✓ Správné' },
    { key: 'wrong',   label: '✗ Špatné' },
    { key: 'skip',    label: '→ Přeskočené' },
  ];

  today(): string {
    return new Date().toLocaleDateString('cs-CZ');
  }

  retry() {
    this.showRetry = true;
  }
}
