import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthFacade } from '@beauty-platform-validated/storefront-data-access';

@Component({
  selector: 'beauty-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
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
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <label>Password</label>
              <a routerLink="/forgot-password" style="font-size: 13px; color: var(--beauty-brand); text-decoration: none;">Forgot password?</a>
            </div>
            <input type="password" formControlName="password" placeholder="Password" />
          </div>
          @if (error(); as message) {
            <p role="alert" style="color: #c53030; font-size: 14px;">{{ message }}</p>
          }
          <button class="beauty-btn beauty-btn--primary" type="submit" [disabled]="form.invalid || isSubmitting()">
            {{ isSubmitting() ? 'Logging in…' : 'Log in' }}
          </button>
        </form>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--beauty-border); text-align: center; font-size: 14px;">
          <span>Don't have an account? </span>
          <a [routerLink]="['/register']" [queryParams]="returnUrl ? { returnUrl } : {}" style="color: var(--beauty-brand); font-weight: 600; text-decoration: none;">
            Create account
          </a>
        </div>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isSubmitting = signal(false);
  readonly error = signal<string | undefined>(undefined);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  get returnUrl(): string | null {
    return this.route.snapshot.queryParamMap.get('returnUrl');
  }

  async onSubmit() {
    if (this.form.invalid) return;
    const { email, password } = this.form.getRawValue();
    this.isSubmitting.set(true);
    this.error.set(undefined);
    try {
      await this.authFacade.login(email, password);
      const target = this.returnUrl;
      if (target) {
        this.router.navigateByUrl(target);
      } else {
        this.router.navigate(['/']);
      }
    } catch {
      this.error.set('Invalid email or password.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
