import { Component, Input, Output, EventEmitter, inject, OnChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../shared/components/modal.component';
import { QuizStateService } from '../../core/services/quiz-state.service';
import { FirebaseService } from '../../core/services/firebase.service';
import { Question } from '../../core/models/quiz.model';

@Component({
  selector: 'app-start-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <app-modal [open]="open" (closed)="closed.emit()">
      <h3 class="text-lg font-semibold mb-1">Spustit kvíz</h3>
      <p class="text-sm text-muted mb-5">Nastav parametry a spusť test.</p>

      <div class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-muted mb-1.5">Název</label>
          <input class="form-input" type="text" [(ngModel)]="name">
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-muted mb-1.5">
              Počet otázek <span class="text-muted">(max {{ questions.length }})</span>
            </label>
            <input class="form-input" type="number" [(ngModel)]="count" [min]="1" [max]="questions.length">
          </div>
          <div>
            <label class="block text-xs font-medium text-muted mb-1.5">Časový limit (min, 0 = bez)</label>
            <input class="form-input" type="number" [(ngModel)]="timeLimitMin" min="0" max="180">
          </div>
        </div>

        <label class="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" [(ngModel)]="shuffle" class="rounded">
          Zamíchat otázky
        </label>
      </div>

      <div class="flex justify-end gap-3 mt-6">
        <button class="btn btn-ghost" (click)="closed.emit()">Zrušit</button>
        @if (firebaseService.getCurrentUser()) {
          <button class="btn btn-outline" (click)="saveToCloud()" [disabled]="!questions.length || savingCloud">
            {{ savingCloud() ? '☁ Ukládám...' : '☁ Uložit do cloudu' }}
          </button>
        }
        <button class="btn btn-primary" (click)="launch()" [disabled]="!questions.length">▶ Spustit</button>
      </div>
    </app-modal>
  `,
})
export class StartModalComponent implements OnChanges {
  @Input() open = false;
  @Input() questions: Question[] = [];
  @Input() defaultName = 'Kvíz';
  @Output() closed = new EventEmitter<void>();

  state = inject(QuizStateService);
  firebaseService = inject(FirebaseService);

  name = 'Kvíz';
  count = 10;
  timeLimitMin = 0;
  shuffle = true;
  savingCloud = signal(false);

  ngOnChanges() {
    if (this.open) {
      this.name = this.defaultName || 'Kvíz';
      this.count = Math.min(10, this.questions.length);
    }
  }

  async saveToCloud() {
    this.savingCloud.set(true);
    try {
      console.log('🔍 Save started - User:', this.firebaseService.getCurrentUser()?.email);
      console.log('🔍 Questions count:', this.questions.length);
      console.log('🔍 Quiz name:', this.name);
      
      if (!this.firebaseService.getCurrentUser()) {
        throw new Error('Nejste přihlášeni');
      }
      
      if (!this.questions.length) {
        throw new Error('Nelze uložit prázdný kvíz');
      }
      
      const config = {
        name: this.name,
        questions: this.questions,
        count: this.count,
        shuffle: this.shuffle,
        timeLimitSeconds: this.timeLimitMin * 60
      };
      
      console.log('🔍 Config to save:', config);
      const result = await this.firebaseService.saveQuizConfig(this.name, config);
      console.log('✅ Save successful!', result);
      alert('✓ Kvíz byl úspěšně uložen do cloudu!');
    } catch (error: any) {
      console.error('❌ Save error:', error);
      alert('❌ Chyba při ukládání: ' + (error.message || 'Neznámá chyba'));
    } finally {
      this.savingCloud.set(false);
    }
  }

  launch() {
    this.state.startQuiz({
      name: this.name,
      questions: this.questions,
      timeLimitSeconds: this.timeLimitMin * 60,
      shuffle: this.shuffle,
      count: Math.min(this.count, this.questions.length),
    });
    this.closed.emit();
  }
}
