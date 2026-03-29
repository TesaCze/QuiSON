import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QuizStateService } from '../../core/services/quiz-state.service';
import { FirebaseService } from '../../core/services/firebase.service';
import { ModalComponent } from '../../shared/components/modal.component';
import { EmptyComponent } from '../../shared/components/empty.component';
import { StartModalComponent } from '../quiz/start-modal.component';
import { Question } from '../../core/models/quiz.model';

@Component({
  selector: 'app-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, EmptyComponent, StartModalComponent],
  template: `
    <div>
      <h2 class="text-xl font-semibold">Sestavit kvíz</h2>
      <p class="text-sm text-muted mt-1 mb-6">Vytvoř sadu otázek a exportuj jako JSON nebo spusť ihned.</p>

      <div class="card mb-4">
        <h3 class="text-base font-semibold mb-4">Nastavení</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-muted mb-1.5">Název kvízu</label>
            <input class="form-input" type="text" [(ngModel)]="quizName" placeholder="Např. OSP – Verbální oddíl">
          </div>
          <div>
            <label class="block text-xs font-medium text-muted mb-1.5">Výchozí časový limit (min, 0 = bez)</label>
            <input class="form-input" type="number" [(ngModel)]="defaultTimeLimitMin" min="0" max="180">
          </div>
        </div>
      </div>

      <div class="card mb-4">
        <div class="flex items-center gap-3 mb-5">
          <h3 class="text-base font-semibold mb-0">Otázky</h3>
          <span class="badge badge-blue">{{ state.questions().length }}</span>
          <button class="btn btn-ghost btn-sm ml-auto" (click)="openAddModal()">+ Přidat otázku</button>
        </div>

        @if (state.questions().length === 0) {
          <app-empty icon="📝" message="Zatím žádné otázky. Přidej první!" />
        } @else {
          <div class="space-y-3">
            @for (q of state.questions(); track q.id; let i = $index) {
              <div class="bg-surface2 border border-border rounded-xl p-4 relative">
                <button
                  class="absolute top-3 right-3 text-muted hover:text-wrong hover:bg-wrong-bg p-1 px-2 rounded text-sm transition-colors"
                  (click)="state.removeQuestion(i)"
                  title="Smazat"
                >✕</button>
                <div class="font-mono text-[11px] text-muted mb-1">OTÁZKA {{ i + 1 }}</div>
                <div class="font-medium text-sm mb-3 pr-8">{{ q.question }}</div>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  @for (entry of optionEntries(q.options); track entry.key) {
                    <div
                      class="text-xs px-2.5 py-1.5 rounded-lg border flex gap-2 items-start"
                      [class.border-correct]="entry.key === q.correct"
                      [class.bg-correct-bg]="entry.key === q.correct"
                      [class.border-border]="entry.key !== q.correct"
                      [class.bg-surface]="entry.key !== q.correct"
                    >
                      <span
                        class="font-mono font-medium flex-shrink-0"
                        [class.text-correct]="entry.key === q.correct"
                        [class.text-accent]="entry.key !== q.correct"
                      >{{ entry.key }}</span>
                      <span>{{ entry.value }}</span>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>

      <div class="flex flex-wrap gap-3 items-center">
        <button class="btn btn-primary" (click)="openStartModal()" [disabled]="!state.questions().length">
          ▶ Spustit kvíz
        </button>
        <button class="btn btn-ghost" (click)="exportJSON()" [disabled]="!state.questions().length">
          ⬇ Export JSON
        </button>
        <button class="btn btn-ghost" (click)="importInput.click()">
          📂 Import JSON
        </button>
        @if (firebaseService.getCurrentUser()) {
          <button class="btn btn-ghost" (click)="saveToFirebase()" [disabled]="!state.questions().length || !quizName.trim()">
            ☁ Uložit do cloudu
          </button>
          <button class="btn btn-ghost" (click)="openLoadModal()">
            ☁ Načíst z cloudu
          </button>
        }
        <input #importInput type="file" accept=".json" class="hidden" (change)="onImport($event)">
        @if (state.questions().length > 0) {
          <button class="btn btn-danger btn-sm ml-auto" (click)="confirmClear()">
            🗑 Vymazat vše
          </button>
        }
      </div>
    </div>

    <app-modal [open]="showAddModal" (closed)="showAddModal = false">
      <h3 class="text-lg font-semibold mb-5">Přidat otázku</h3>
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-muted mb-1.5">Text otázky</label>
          <textarea class="form-input min-h-[80px] resize-y" [(ngModel)]="newQ.question" placeholder="Napište otázku..."></textarea>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-muted mb-1.5">A) Možnost</label>
            <input class="form-input" type="text" [(ngModel)]="newQ.options['A']" placeholder="Možnost A">
          </div>
          <div>
            <label class="block text-xs font-medium text-muted mb-1.5">B) Možnost</label>
            <input class="form-input" type="text" [(ngModel)]="newQ.options['B']" placeholder="Možnost B">
          </div>
          <div>
            <label class="block text-xs font-medium text-muted mb-1.5">C) Možnost</label>
            <input class="form-input" type="text" [(ngModel)]="newQ.options['C']" placeholder="Možnost C">
          </div>
          <div>
            <label class="block text-xs font-medium text-muted mb-1.5">D) Možnost</label>
            <input class="form-input" type="text" [(ngModel)]="newQ.options['D']" placeholder="Možnost D">
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-muted mb-1.5">Správná odpověď</label>
          <select class="form-input" [(ngModel)]="newQ.correct">
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
          </select>
        </div>
      </div>
      <div class="flex justify-end gap-3 mt-6">
        <button class="btn btn-ghost" (click)="showAddModal = false">Zrušit</button>
        <button class="btn btn-primary" (click)="saveQuestion()">Uložit</button>
      </div>
    </app-modal>

    <app-start-modal
      [open]="showStartModal"
      [questions]="state.questions()"
      [defaultName]="quizName"
      (closed)="showStartModal = false"
    />

    <app-modal [open]="showLoadModal" (closed)="showLoadModal = false" maxWidth="600px">
      <h3 class="text-lg font-semibold mb-4">Načíst kvíz z cloudu</h3>
      @if (savedConfigs.length === 0) {
        <p class="text-muted">Žádné uložené kvízy.</p>
      } @else {
        <div class="space-y-2 max-h-60 overflow-y-auto">
          @for (config of savedConfigs; track config.id) {
            <div class="flex items-center justify-between p-3 bg-surface2 rounded-lg">
              <div>
                <p class="font-medium">{{ config.name }}</p>
                <p class="text-sm text-muted">{{ config.questions?.length || 0 }} otázek</p>
              </div>
              <div class="flex gap-2">
                <button class="btn btn-sm btn-primary" (click)="loadConfig(config)">Načíst</button>
                <button class="btn btn-sm btn-danger" (click)="deleteConfig(config.id)">Smazat</button>
              </div>
            </div>
          }
        </div>
      }
      <div class="flex justify-end mt-4">
        <button class="btn btn-ghost" (click)="showLoadModal = false">Zavřít</button>
      </div>
    </app-modal>

    <div class="mt-8">
      <div class="card">
        <h3 class="text-base font-semibold mb-2">📋 Formát JSON pro import</h3>
        <p class="text-xs text-muted mb-3">Pokud chceš importovat otázky, použij tento formát:</p>
        <pre class="bg-surface2 border border-border rounded-lg p-4 text-xs font-mono overflow-x-auto text-[#1a1917]">{{ jsonFormatExample }}</pre>
      </div>
    </div>
  `,
})
export class BuilderComponent {
  state = inject(QuizStateService);
  firebaseService = inject(FirebaseService);

  quizName = 'Můj SCIO kvíz';
  defaultTimeLimitMin = 0;
  showAddModal = false;
  showStartModal = false;
  showLoadModal = false;
  savedConfigs: any[] = [];

  jsonFormatExample = `[
  {
    "id": 1,
    "question": "Text otázky?",
    "options": {
      "A": "Možnost A",
      "B": "Možnost B",
      "C": "Možnost C",
      "D": "Možnost D"
    },
    "correct": "A"
  }
]`;

  newQ = this.emptyQ();

  emptyQ() {
    return {
      question: '',
      options: { A: '', B: '', C: '', D: '' } as Record<string, string>,
      correct: 'A' as 'A' | 'B' | 'C' | 'D',
    };
  }

  optionEntries(options: Record<string, string>) {
    return Object.entries(options).map(([key, value]) => ({ key, value }));
  }

  openAddModal() {
    this.newQ = this.emptyQ();
    this.showAddModal = true;
  }

  saveQuestion() {
    const { question, options, correct } = this.newQ;
    if (!question.trim() || !options['A'] || !options['B'] || !options['C'] || !options['D']) {
      alert('Vyplň všechna pole!');
      return;
    }
    const q: Question = {
      id: Date.now(),
      question,
      options: options as Record<'A' | 'B' | 'C' | 'D', string>,
      correct,
    };
    this.state.addQuestion(q);
    this.showAddModal = false;
  }

  openStartModal() {
    this.showStartModal = true;
  }

  exportJSON() {
    const data = JSON.stringify(this.state.questions(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (this.quizName || 'quiz').replace(/\s+/g, '-').toLowerCase() + '.json';
    a.click();
  }

  onImport(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(data) || !data[0]?.question) throw new Error('Špatný formát');
        this.state.setQuestions(data);
      } catch (err: any) {
        alert('Chyba: ' + err.message);
      }
    };
    reader.readAsText(file);
    (e.target as HTMLInputElement).value = '';
  }

  confirmClear() {
    if (confirm('Opravdu vymazat všechny otázky?')) {
      this.state.clearQuestions();
    }
  }

  async saveToFirebase() {
    try {
      console.log('🔍 Builder save started - User:', this.firebaseService.getCurrentUser()?.email);
      if (!this.firebaseService.getCurrentUser()) {
        throw new Error('Nejste přihlášeni');
      }
      if (!this.quizName.trim()) {
        throw new Error('Zadejte název kvízu');
      }
      if (!this.state.questions().length) {
        throw new Error('Přidejte alespoň jednu otázku');
      }
      
      const config = {
        name: this.quizName,
        questions: this.state.questions(),
        count: this.state.questions().length,
        shuffle: false
      };
      
      console.log('🔍 Config to save:', { ...config, questions: `[${config.questions.length} otázek]` });
      await this.firebaseService.saveQuizConfig(this.quizName, config);
      console.log('✅ Save successful!');
      alert('✓ Kvíz byl úspěšně uložen do cloudu!');
    } catch (error: any) {
      console.error('❌ Save error:', error);
      alert('❌ Chyba při ukládání: ' + (error.message || 'Neznámá chyba'));
    }
  }

  async openLoadModal() {
    this.showLoadModal = true;
    try {
      this.savedConfigs = await this.state.loadQuizConfigs();
    } catch (error: any) {
      alert('Chyba při načítání: ' + error.message);
      this.savedConfigs = [];
    }
  }

  async loadConfig(config: any) {
    this.state.loadQuizConfig(config);
    this.quizName = config.name;
    this.showLoadModal = false;
  }

  async deleteConfig(configId: string) {
    if (confirm('Opravdu smazat tento kvíz?')) {
      try {
        await this.state.deleteQuizConfig(configId);
        this.savedConfigs = this.savedConfigs.filter(c => c.id !== configId);
      } catch (error: any) {
        alert('Chyba při mazání: ' + error.message);
      }
    }
  }
}
