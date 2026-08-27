import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthFacade } from '@beauty-platform-validated/storefront-data-access';

@Component({
  selector: 'beauty-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="page-shell">
      <div class="auth-panel" style="max-width: 480px; margin: 56px auto; padding: 32px;">
        <div class="beauty-subtle">Welcome back</div>
        <h1>Log in</h1>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-grid" style="grid-template-columns: 1fr;">
          <div class="field">
            <label>Email</label>
            <input type="email" formControlName="email" placeholder="Email" />
          </div>
          <div class="field">
            <label>Password</label>
            <input type="password" formControlName="password" placeholder="Password" />
          </div>
          @if (error(); as message) {
            <p role="alert">{{ message }}</p>
          }
          <button class="beauty-btn beauty-btn--primary" type="submit" [disabled]="form.invalid || isSubmitting()">
            {{ isSubmitting() ? 'Logging in…' : 'Log in' }}
          </button>
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly error = signal<string | undefined>(undefined);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  async onSubmit() {
    if (this.form.invalid) return;
    const { email, password } = this.form.getRawValue();
    this.isSubmitting.set(true);
    this.error.set(undefined);
    try {
      await this.authFacade.login(email, password);
      this.router.navigate(['/']);
    } catch {
      this.error.set('Invalid email or password.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
