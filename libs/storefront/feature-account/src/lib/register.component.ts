import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthFacade } from '@beauty-platform-validated/storefront-data-access';

@Component({
  selector: 'beauty-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-shell">
      <div class="auth-panel" style="max-width: 560px; margin: 56px auto; padding: 32px;">
        <div class="beauty-subtle">Create your account</div>
        <h1>Create account</h1>
        <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-grid">
          <div class="field"><label>First name</label><input formControlName="firstName" placeholder="First name" /></div>
          <div class="field"><label>Last name</label><input formControlName="lastName" placeholder="Last name" /></div>
          <div class="field" style="grid-column: 1 / -1;"><label>Email</label><input type="email" formControlName="email" placeholder="Email" /></div>
          <div class="field" style="grid-column: 1 / -1;"><label>Password</label><input type="password" formControlName="password" placeholder="Password (min 8 characters)" /></div>
          @if (form.controls.password.invalid && form.controls.password.touched) {
            <p style="grid-column: 1 / -1; color: #c53030; font-size: 13px;">Password must be at least 8 characters.</p>
          }
          @if (error(); as message) {
            <p role="alert" style="grid-column: 1 / -1; color: #c53030; font-size: 14px;">{{ message }}</p>
          }
          <button class="beauty-btn beauty-btn--primary" type="submit" [disabled]="form.invalid || isSubmitting()" style="grid-column: 1 / -1;">
            {{ isSubmitting() ? 'Creating account…' : 'Create account' }}
          </button>
        </form>

        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--beauty-border); text-align: center; font-size: 14px;">
          <span>Already have an account? </span>
          <a [routerLink]="['/login']" [queryParams]="returnUrl ? { returnUrl } : {}" style="color: var(--beauty-brand); font-weight: 600; text-decoration: none;">
            Sign in
          </a>
        </div>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly isSubmitting = signal(false);
  readonly error = signal<string | undefined>(undefined);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  get returnUrl(): string | null {
    return this.route.snapshot.queryParamMap.get('returnUrl');
  }

  async onSubmit() {
    if (this.form.invalid) return;
    const { email, password, firstName, lastName } = this.form.getRawValue();
    this.isSubmitting.set(true);
    this.error.set(undefined);
    try {
      await this.authFacade.register(email, password, firstName, lastName);
      const target = this.returnUrl;
      if (target) {
        this.router.navigateByUrl(target);
      } else {
        this.router.navigate(['/']);
      }
    } catch {
      this.error.set('Could not create account. That email may already be registered.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
