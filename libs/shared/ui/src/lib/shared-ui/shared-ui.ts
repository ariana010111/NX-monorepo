import { Component, input } from '@angular/core';

/**
 * Centralized shared button primitive for the premium beauty system.
 */
@Component({
  selector: 'beauty-button',
  standalone: true,
  template: `
    <button
      class="beauty-btn"
      [class.beauty-btn--primary]="variant() === 'primary'"
      [class.beauty-btn--secondary]="variant() === 'secondary'"
      [attr.type]="type()"
    >
      <ng-content></ng-content>
    </button>
  `,
  styleUrl: './shared-ui.css',
})
export class ButtonComponent {
  readonly variant = input<'primary' | 'secondary'>('primary');
  readonly type = input<'button' | 'submit' | 'reset'>('button');
}
