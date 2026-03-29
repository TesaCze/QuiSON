import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuizStateService } from './core/services/quiz-state.service';
import { FirebaseService } from './core/services/firebase.service';
import { HeaderComponent } from './shared/components/header.component';
import { AuthComponent } from './shared/components/auth.component';
import { HomeComponent } from './features/home/home.component';
import { BuilderComponent } from './features/builder/builder.component';
import { QuizComponent } from './features/quiz/quiz.component';
import { ResultsComponent } from './features/results/results.component';
import { HistoryComponent } from './features/history/history.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    AuthComponent,
    HomeComponent,
    BuilderComponent,
    QuizComponent,
    ResultsComponent,
    HistoryComponent,
  ],
  template: `
    @if (!firebaseService.getCurrentUser()) {
      <div class="flex flex-col min-h-screen items-center justify-center p-6 bg-surface">
        <div class="w-full max-w-md">
          <div class="text-center mb-8">
            <div class="font-mono text-5xl font-medium text-accent tracking-tight mb-2">
              Qui<span class="text-muted">SON</span>
            </div>
            <p class="text-muted">Trénink SCIO testů — login k začátku</p>
          </div>
          <app-auth />
        </div>
      </div>
    } @else {
      <div class="flex flex-col min-h-screen">
        @if (state.currentView() !== 'quiz') {
          <app-header />
        }

        <main class="flex-1 max-w-3xl mx-auto w-full px-6 py-8">
          @switch (state.currentView()) {
            @case ('home')    { <app-home /> }
            @case ('builder') { <app-builder /> }
            @case ('quiz')    { <app-quiz /> }
            @case ('results') { <app-results /> }
            @case ('history') { <app-history /> }
          }
        </main>
      </div>
    }
  `,
})
export class AppComponent implements OnInit {
  state = inject(QuizStateService);
  firebaseService = inject(FirebaseService);

  ngOnInit() {
    const checkAuth = setInterval(() => {
      if (this.firebaseService.getCurrentUser()) {
        this.state.loadHistoryFromFirebase();
        clearInterval(checkAuth);
      }
    }, 500);
  }
}
