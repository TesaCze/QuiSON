import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="fixed inset-0 bg-black/35 flex items-center justify-center z-50 p-5 transition-opacity duration-200"
      [class.opacity-0]="!open"
      [class.pointer-events-none]="!open"
      [class.opacity-100]="open"
      (click)="onOverlayClick($event)"
    >
      <div
        class="bg-surface rounded-2xl p-7 w-full shadow-2xl transition-transform duration-200 overflow-y-auto"
        [style.max-width]="maxWidth"
        [style.max-height]="maxHeight"
        [class.translate-y-2]="!open"
        (click)="$event.stopPropagation()"
      >
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class ModalComponent {
  @Input() open = false;
  @Input() maxWidth = '500px';
  @Input() maxHeight = '90vh';
  @Output() closed = new EventEmitter<void>();

  onOverlayClick(e: MouseEvent) {
    if ((e.target as HTMLElement) === e.currentTarget) {
      this.closed.emit();
    }
  }
}
