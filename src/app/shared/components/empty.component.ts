import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty',
  standalone: true,
  template: `
    <div class="text-center py-14 text-muted">
      <div class="text-5xl mb-3">{{ icon }}</div>
      <p class="text-sm">{{ message }}</p>
    </div>
  `,
})
export class EmptyComponent {
  @Input() icon = '📭';
  @Input() message = 'Nic zde není.';
}
