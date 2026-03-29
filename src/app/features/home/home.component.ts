import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuizStateService } from '../../core/services/quiz-state.service';
import { FirebaseService } from '../../core/services/firebase.service';
import { ModalComponent } from '../../shared/components/modal.component';
import { Question } from '../../core/models/quiz.model';
import { StartModalComponent } from '../quiz/start-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ModalComponent, StartModalComponent],
  template: `
    <div>
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold mb-1">👋 Vítej v QuiSON</h1>
        <p class="text-muted">{{ firebaseService.getCurrentUser()?.displayName || 'Uživateli' }}</p>
      </div>

      <div class="grid grid-cols-3 gap-3 mb-8">
        <button class="btn btn-primary h-auto flex-col py-4" (click)="fileInput.click()">
          <div class="text-2xl mb-1">📂</div>
          <div class="text-sm">Import</div>
        </button>
        <button class="btn btn-ghost h-auto flex-col py-4" (click)="state.navigate('builder')">
          <div class="text-2xl mb-1">✏️</div>
          <div class="text-sm">Vytvořit</div>
        </button>
        <button class="btn btn-ghost h-auto flex-col py-4" (click)="loadExample()">
          <div class="text-2xl mb-1">🎓</div>
          <div class="text-sm">Příklad</div>
        </button>
      </div>

      <input #fileInput type="file" accept=".json" class="hidden" (change)="onFileChange($event)">

      <div class="card mb-8">
        <div class="flex items-center gap-2 mb-4">
          <h2 class="text-xl font-semibold">☁ Tvé Quízy</h2>
          <button class="btn btn-sm btn-ghost" (click)="loadCloudQuizzes()" [disabled]="loadingCloud()">
            🔄
          </button>
          <button class="btn btn-sm btn-primary ml-auto" (click)="cloudImportInput.click()">
            ⬆ Importovat do cloudu
          </button>
        </div>

        @if (loadingCloud()) {
          <div class="text-center py-8 text-muted">Načítám tvé kvízy...</div>
        } @else if (cloudQuizzes().length === 0) {
          <div class="text-center py-8 text-muted">
            <p class="text-sm">Letos ještě nemáš uložené kvízy</p>
            <p class="text-xs mt-1">Importuj nebo vytvoř quiz a ulož ho do cloudu</p>
          </div>
        } @else {
          <div class="space-y-2">
            @for (quiz of cloudQuizzes(); track quiz.id) {
              <div class="flex items-center justify-between p-3 bg-surface2 rounded-lg hover:bg-surface transition-colors">
                <div class="min-w-0 flex-1">
                  <p class="font-medium text-sm truncate">{{ quiz.name }}</p>
                  <p class="text-xs text-muted mt-0.5">{{ quiz.questions?.length || 0 }} otázek</p>
                </div>
                <button class="btn btn-sm btn-primary" (click)="loadCloudQuiz(quiz)">
                  Spustit
                </button>
              </div>
            }
          </div>
        }
      </div>

      <input #cloudImportInput type="file" accept=".json" class="hidden" (change)="onCloudImport($event)">

      <div class="card">
        <div
          class="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer transition-all duration-200 bg-surface2"
          [class.border-accent]="isDragging"
          [class.bg-accent-light]="isDragging"
          (dragover)="onDragOver($event)"
          (dragleave)="isDragging = false"
          (drop)="onDrop($event)"
          (click)="fileInput.click()"
        >
          <div class="text-4xl mb-3">📄</div>
          <p class="text-muted text-sm">
            <strong class="text-accent">Přetáhni JSON soubor</strong> nebo klikni pro výběr
          </p>
          <p class="text-xs text-muted mt-1.5">Podporuje formát QuiSON (.json)</p>
        </div>
      </div>
    </div>

    <app-start-modal
      [open]="showStartModal"
      [questions]="pendingQuestions"
      [defaultName]="pendingName"
      (closed)="showStartModal = false"
    />
  `,
})
export class HomeComponent implements OnInit {
  state = inject(QuizStateService);
  firebaseService = inject(FirebaseService);

  isDragging = false;
  showStartModal = false;
  cloudQuizzes = signal<any[]>([]);
  loadingCloud = signal(false);
  pendingQuestions: Question[] = [];
  pendingName = '';

  ngOnInit() {
    this.loadCloudQuizzes();
  }

  async loadCloudQuizzes() {
    this.loadingCloud.set(true);
    try {
      const quizzes = await this.state.loadQuizConfigs();
      this.cloudQuizzes.set(quizzes);
    } catch (error) {
      console.error('Error loading cloud quizzes:', error);
    } finally {
      this.loadingCloud.set(false);
    }
  }

  async loadCloudQuiz(quiz: any) {
    this.state.setQuestions(quiz.questions);
    this.pendingName = quiz.name;
    this.pendingQuestions = quiz.questions;
    this.showStartModal = true;
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    this.isDragging = true;
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.isDragging = false;
    const file = e.dataTransfer?.files[0];
    if (file?.name.endsWith('.json')) this.readFile(file);
  }

  onFileChange(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) this.readFile(file);
    (e.target as HTMLInputElement).value = '';
  }

  readFile(file: File) {
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(data) || !data[0]?.question) throw new Error('Špatný formát');
        this.pendingQuestions = data;
        this.pendingName = file.name.replace('.json', '');
        this.state.setQuestions(data);
        this.showStartModal = true;
      } catch (err: any) {
        alert('Chyba při načítání JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  loadExample() {
    this.pendingQuestions = EXAMPLE_QUESTIONS;
    this.pendingName = 'Ukázkový SCIO kvíz';
    this.state.setQuestions(EXAMPLE_QUESTIONS);
    this.showStartModal = true;
  }

  async onCloudImport(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async ev => {
      try {
        console.log('📂 Cloud import started');
        const data = JSON.parse(ev.target?.result as string);
        if (!Array.isArray(data) || !data[0]?.question) {
          throw new Error('Špatný formát JSON');
        }
        
        const quizName = file.name.replace('.json', '');
        const config = {
          name: quizName,
          questions: data,
          count: data.length,
          shuffle: false
        };
        
        console.log('🔍 Saving to cloud:', { name: quizName, questionCount: data.length });
        await this.firebaseService.saveQuizConfig(quizName, config);
        console.log('✅ Cloud import successful!');
        alert('✓ Kvíz úspěšně importován do cloudu!');
        await this.loadCloudQuizzes();
      } catch (err: any) {
        console.error('❌ Cloud import error:', err);
        alert('❌ Chyba při importu: ' + err.message);
      }
    };
    reader.readAsText(file);
    (e.target as HTMLInputElement).value = '';
  }
}

const EXAMPLE_QUESTIONS: Question[] = [
  { id: 1, question: 'Nová aplikace obsahuje výukové materiály, ze kterých si můžete ______ lekce na míru ______ požadavkům.', options: { A: 'vytvářet – svým', B: 'vyrábět – obecným', C: 'sestavovat – výsledným', D: 'upravovat – vzdělávaným' }, correct: 'A' },
  { id: 2, question: '______ lesní úseky po zpevněných komunikacích mohou být poněkud ______, proto jsou dobré panely naučné stezky.', options: { A: 'Rozsáhlé – nepřehledné', B: 'Neoznačené – nebezpečné', C: 'Dlouhé – monotónní', D: 'Asfaltové – nesjízdné' }, correct: 'C' },
  { id: 3, question: 'V bitvě u Kurska byly tanky Panther nasazeny příliš brzy a:', options: { A: 's velkým úspěchem', B: 'bez řádného odzkoušení, s nezdarem', C: 'po důkladné přípravě, ale technicky selhaly', D: 'správně načasovaně' }, correct: 'B' },
  { id: 4, question: 'Pátá základní chuť umami byla popsána japonským chemikem Ikedou v roce:', options: { A: '1888', B: '1908', C: '1928', D: '1948' }, correct: 'B' },
  { id: 5, question: 'Kolik aktivních vulkanických lokalit se nachází na Islandu?', options: { A: 'přibližně 10', B: 'přibližně 20', C: 'přibližně 30', D: 'přibližně 50' }, correct: 'C' },
  { id: 6, question: 'HRNEK : ______ = ______ : BENZÍN', options: { A: 'nádoba – palivo', B: 'čaj – nádrž', C: 'kuchyň – pumpa', D: 'objem – kvalita' }, correct: 'B' },
  { id: 7, question: 'Synonymum slova „lamentoval" je:', options: { A: 'rokoval', B: 'rozjímal', C: 'bědoval', D: 'dumal' }, correct: 'C' },
  { id: 8, question: 'Antonymum slova „absurdní" je:', options: { A: 'zbytečný', B: 'logický', C: 'ironický', D: 'poťouchlý' }, correct: 'B' },
  { id: 9, question: 'Firma Lifetech se zabývá odstraňováním pesticidů z vody přibližně:', options: { A: '5 let', B: '15 let', C: '26 let', D: '2 roky' }, correct: 'B' },
  { id: 10, question: 'Obvod čtyřúhelníka je 80 cm, a je o 8 cm kratší než c, b je o 4 cm delší než a, d je dvakrát delší než b. Délka strany b:', options: { A: '12 cm', B: '16 cm', C: '20 cm', D: '24 cm' }, correct: 'B' },
];
