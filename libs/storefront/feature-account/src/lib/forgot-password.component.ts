import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BeautyPlatformAPIService } from '@beauty-platform-validated/api-client';

@Component({
  selector: 'beauty-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-shell">
      <div class="auth-panel" style="max-width: 480px; margin: 56px auto; padding: 32px;">
        <div class="beauty-subtle">Account recovery</div>
        <h1>Reset password</h1>
        <p style="color: var(--beauty-text-secondary); font-size: 14px; margin-bottom: 24px;">
          Enter the email address associated with your account, and we'll send you instructions to reset your password.
        </p>

        @if (submitted()) {
          <div style="background: rgba(45, 125, 92, 0.08); border: 1px solid rgba(45, 125, 92, 0.2); border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <p style="color: var(--beauty-success); font-weight: 600; margin: 0 0 8px 0;">Request received</p>
            <p style="font-size: 14px; color: var(--beauty-text); margin: 0;">
              If an account with that email exists, password reset instructions have been sent.
            </p>
          </div>
          <div style="text-align: center;">
            <a routerLink="/login" class="beauty-btn beauty-btn--primary" style="text-decoration: none; display: inline-block;">
              Return to Sign In
            </a>
          </div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-grid" style="grid-template-columns: 1fr;">
            <div class="field">
              <label>Email address</label>
              <input type="email" formControlName="email" placeholder="you@example.com" />
            </div>
            @if (error(); as message) {
              <p role="alert" style="color: #c53030; font-size: 14px;">{{ message }}</p>
            }
            <button class="beauty-btn beauty-btn--primary" type="submit" [disabled]="form.invalid || isSubmitting()">
              {{ isSubmitting() ? 'Sending instructions…' : 'Send reset instructions' }}
            </button>
          </form>

          <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--beauty-border); text-align: center; font-size: 14px;">
            <span>Remember your password? </span>
            <a routerLink="/login" style="color: var(--beauty-brand); font-weight: 600; text-decoration: none;">
              Sign in
            </a>
          </div>
        }
      </div>
    </div>
  `,
})
export class ForgotPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(BeautyPlatformAPIService);

  readonly isSubmitting = signal(false);
  readonly submitted = signal(false);
  readonly error = signal<string | undefined>(undefined);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  async onSubmit() {
    if (this.form.invalid) return;
    const { email } = this.form.getRawValue();
    this.isSubmitting.set(true);
    this.error.set(undefined);
    try {
      await new Promise((resolve, reject) =>
        this.api.authControllerForgotPassword({ email }).subscribe({ next: resolve, error: reject }),
      );
      this.submitted.set(true);
    } catch {
      // Even if network fails or endpoint returns an error, avoid account enumeration leaks
      this.submitted.set(true);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
