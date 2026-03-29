import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuizStateService } from '../../core/services/quiz-state.service';
import { ModalComponent } from '../../shared/components/modal.component';
import { EmptyComponent } from '../../shared/components/empty.component';
import { FormatTimePipe } from '../../shared/pipes/format-time.pipe';
import { HistoryEntry } from '../../core/models/quiz.model';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, ModalComponent, EmptyComponent, FormatTimePipe],
  template: `
    <div>
      <div class="flex items-center gap-3 mb-6">
        <h2 class="text-2xl font-bold">📊 Historie kvízů</h2>
        @if (state.history().length > 0) {
          <button class="btn btn-danger btn-sm ml-auto" (click)="confirmClear()">
            🗑 Vymazat vše
          </button>
        }
      </div>

      @if (state.history().length === 0) {
        <app-empty icon="📊" message="Zatím žádná historie. Spusť svůj první kvíz!" />
      } @else {
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div class="card !p-4 text-center">
            <div class="text-2xl font-bold text-accent">{{ state.history().length }}</div>
            <div class="text-xs text-muted mt-1">Kvízů</div>
          </div>
          <div class="card !p-4 text-center">
            <div class="text-2xl font-bold text-green">{{ getTotalCorrect() }}</div>
            <div class="text-xs text-muted mt-1">Správných</div>
          </div>
          <div class="card !p-4 text-center">
            <div class="text-2xl font-bold text-correct">{{ getAverageScore() }}%</div>
            <div class="text-xs text-muted mt-1">Průměr</div>
          </div>
          <div class="card !p-4 text-center">
            <div class="text-2xl font-bold text-accent">{{ getTotalTime() }}</div>
            <div class="text-xs text-muted mt-1">Celkový čas</div>
          </div>
        </div>

        <div class="space-y-3">
          @for (entry of state.history(); track entry.id) {
            <div
              class="card !p-0 overflow-hidden cursor-pointer hover:border-accent transition-all duration-150"
              (click)="openDetail(entry)"
            >
              <div class="flex items-stretch h-20">
                <div
                  class="w-1 transition-colors duration-200"
                  [class.bg-green]="entry.pct >= 80"
                  [class.bg-yellow]="entry.pct >= 60 && entry.pct < 80"
                  [class.bg-orange]="entry.pct >= 40 && entry.pct < 60"
                  [class.bg-red]="entry.pct < 40"
                ></div>
                <div class="flex-1 p-4 flex flex-col justify-center">
                  <div class="font-semibold text-sm mb-1">{{ entry.name }}</div>
                  <div class="text-xs text-muted">
                    {{ formatDate(entry.date) }} · {{ entry.elapsed | formatTime }}
                  </div>
                </div>
                <div class="px-4 py-4 flex items-center justify-between gap-4 text-right bg-surface2">
                  <div class="hidden sm:block">
                    <div class="flex gap-2">
                      <span class="text-xs"><span class="text-green font-semibold">{{ entry.correct }}</span>/{{ entry.total }}</span>
                      <span class="text-muted text-xs">·</span>
                      <span class="text-xs"><span
                        class="font-semibold"
                        [class.text-green]="entry.pct >= 80"
                        [class.text-yellow]="entry.pct >= 60 && entry.pct < 80"
                        [class.text-orange]="entry.pct >= 40 && entry.pct < 60"
                        [class.text-red]="entry.pct < 40"
                      >{{ entry.pct }}%</span></span>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-lg font-bold"
                      [class.text-green]="entry.pct >= 80"
                      [class.text-yellow]="entry.pct >= 60 && entry.pct < 80"
                      [class.text-orange]="entry.pct >= 40 && entry.pct < 60"
                      [class.text-red]="entry.pct < 40"
                    >{{ entry.pct }}%</div>
                    <div class="text-xs text-muted">Skóre</div>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <app-modal [open]="!!selectedEntry\" (closed)=\"selectedEntry = null\" maxWidth=\"600px\" maxHeight=\"80vh\">
      @if (selectedEntry) {
        <h3 class="text-lg font-semibold mb-1">{{ selectedEntry.name }}</h3>
        <p class="text-xs text-muted mb-5">
          {{ formatDate(selectedEntry.date) }} ·
          {{ selectedEntry.pct }}% ·
          Čas: {{ selectedEntry.elapsed | formatTime }}
        </p>

        <div class="space-y-2">
          @for (a of selectedEntry.answers; track a.questionId) {
            <div
              class="result-item"
              [class.r-correct]="!a.skipped && a.selected === a.correct"
              [class.r-wrong]="!a.skipped && a.selected !== a.correct"
              [class.r-skip]="a.skipped"
            >
              <span class="text-base flex-shrink-0 mt-0.5">
                {{ a.skipped ? '→' : a.selected === a.correct ? '✓' : '✗' }}
              </span>
              <div class="min-w-0">
                <p class="text-xs font-medium mb-1 leading-snug">{{ a.question }}</p>
                <p class="text-xs text-muted">
                  @if (a.skipped) {
                    Přeskočeno · Správně: <span class="font-mono">{{ a.correct }}) {{ a.options[a.correct] }}</span>
                  } @else if (a.selected === a.correct) {
                    Správně: <span class="font-mono">{{ a.correct }}) {{ a.options[a.correct] }}</span>
                  } @else {
                    Odpověď: <span class="font-mono">{{ a.selected }}) {{ a.options[a.selected!] }}</span>
                    · Správně: <span class="font-mono">{{ a.correct }}) {{ a.options[a.correct] }}</span>
                  }
                </p>
              </div>
            </div>
          }
        </div>

        <div class="flex justify-end mt-5">
          <button class="btn btn-ghost" (click)="selectedEntry = null">Zavřít</button>
        </div>
      }
    </app-modal>
  `,
})
export class HistoryComponent {
  state = inject(QuizStateService);
  selectedEntry: HistoryEntry | null = null;

  openDetail(entry: HistoryEntry) {
    this.selectedEntry = entry;
  }

  formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('cs-CZ') + ' ' +
      d.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
  }

  getTotalCorrect(): number {
    return this.state.history().reduce((sum, e) => sum + e.correct, 0);
  }

  getAverageScore(): number {
    const entries = this.state.history();
    if (entries.length === 0) return 0;
    const total = entries.reduce((sum, e) => sum + e.pct, 0);
    return Math.round(total / entries.length);
  }

  getTotalTime(): string {
    const totalSeconds = this.state.history().reduce((sum, e) => sum + e.elapsed, 0);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  confirmClear() {
    if (confirm('Opravdu vymazat celou historii?')) {
      this.state.clearHistory();
    }
  }
}
