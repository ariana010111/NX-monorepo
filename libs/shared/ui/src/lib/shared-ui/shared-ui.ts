import { Component, input } from '@angular/core';

/**
 * The premium visual language lives here, centrally. Wraps standard
 * interaction behavior but owns the actual brand look — changing the
 * primary button style is a one-file change, not a grep across features.
 */
@Component({
  selector: 'beauty-button',
  imports: [],
  template: `<button class="beauty-btn" [class.beauty-btn--primary]="variant() === 'primary'">
    <ng-content></ng-content>
  </button>`,
  styleUrl: './shared-ui.css',
})
export class ButtonComponent {
  variant = input<'primary' | 'secondary'>('primary');
}
