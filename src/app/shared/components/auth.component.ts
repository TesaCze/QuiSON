import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FirebaseService } from '../../core/services/firebase.service';
import { QuizStateService } from '../../core/services/quiz-state.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="text-center">
      <h2 class="text-2xl font-bold mb-4">Login with Google</h2>
      <button
        (click)="signInWithGoogle()"
        class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        [disabled]="loading"
      >
        {{ loading ? 'Signing in...' : 'Sign in with Google' }}
      </button>
      <p class="mt-4 text-sm text-gray-600">
        Login to sync your quiz history and save tests across devices.
      </p>
      @if (error) {
        <p class="mt-2 text-red-500">{{ error }}</p>
      }
    </div>
  `,
})
export class AuthComponent {
  private firebaseService = inject(FirebaseService);
  private quizStateService = inject(QuizStateService);

  @Output() loginSuccess = new EventEmitter<void>();

  loading = false;
  error = '';

  async signInWithGoogle() {
    this.loading = true;
    this.error = '';
    try {
      await this.firebaseService.signInWithGoogle();
      await this.quizStateService.loadHistoryFromFirebase();
      this.loginSuccess.emit();
    } catch (error: any) {
      this.error = error.message || 'Login failed';
    } finally {
      this.loading = false;
    }
  }
}