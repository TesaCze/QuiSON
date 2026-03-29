import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuizStateService } from '../../core/services/quiz-state.service';
import { FirebaseService } from '../../core/services/firebase.service';
import { NavView } from '../../core/models/quiz.model';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="bg-surface border-b border-border sticky top-0 z-50">
      <div class="max-w-3xl mx-auto px-6 h-14 flex items-center gap-5">
        <button
          class="font-mono text-lg font-medium text-accent tracking-tight cursor-pointer bg-none border-none p-0"
          (click)="nav('home')"
        >
          Qui<span class="text-muted font-normal">SON</span>
        </button>

        <nav class="flex gap-1 ml-auto items-center">
          @for (item of navItems; track item.view) {
            <button
              class="px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 border-none cursor-pointer"
              [class.bg-accent-light]="state.currentView() === item.view"
              [class.text-accent]="state.currentView() === item.view"
              [class.text-muted]="state.currentView() !== item.view"
              [class.hover:bg-surface2]="state.currentView() !== item.view"
              (click)="nav(item.view)"
            >
              {{ item.label }}
            </button>
          }
          <div class="w-px h-5 bg-border mx-2"></div>
          <button
            class="px-3.5 py-1.5 rounded-lg text-sm font-medium text-muted hover:bg-surface2 transition-all duration-150 border-none cursor-pointer"
            (click)="logout()"
            title="Odhlásit"
          >
            🚪 Odhlásit
          </button>
        </nav>
      </div>
    </header>
  `,
})
export class HeaderComponent {
  state = inject(QuizStateService);
  firebaseService = inject(FirebaseService);

  navItems: { view: NavView; label: string }[] = [
    { view: 'home',    label: 'Domů' },
    { view: 'builder', label: 'Sestavit' },
    { view: 'history', label: 'Historie' },
  ];

  nav(view: NavView) {
    if (this.state.currentView() === 'quiz') return;
    this.state.navigate(view);
  }

  logout() {
    if (confirm('Opravdu chceš odhlásit?')) {
      this.firebaseService.signOut().then(() => {
        this.state.navigate('home');
        window.location.reload();
      }).catch(error => {
        console.error('Logout error:', error);
        alert('Chyba při odhlášení: ' + error.message);
      });
    }
  }
}
