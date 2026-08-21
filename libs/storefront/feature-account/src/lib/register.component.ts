import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthFacade } from '@beauty-platform-validated/storefront-data-access';

@Component({
  selector: 'beauty-register',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <h1>Create account</h1>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <input formControlName="firstName" placeholder="First name" />
      <input formControlName="lastName" placeholder="Last name" />
      <input type="email" formControlName="email" placeholder="Email" />
      <input type="password" formControlName="password" placeholder="Password (min 8 characters)" />
      @if (form.controls.password.invalid && form.controls.password.touched) {
        <p>Password must be at least 8 characters.</p>
      }
      @if (error(); as message) {
        <p role="alert">{{ message }}</p>
      }
      <button type="submit" [disabled]="form.invalid || isSubmitting()">
        {{ isSubmitting() ? 'Creating account…' : 'Create account' }}
      </button>
    </form>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authFacade = inject(AuthFacade);
  private readonly router = inject(Router);

  readonly isSubmitting = signal(false);
  readonly error = signal<string | undefined>(undefined);

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  async onSubmit() {
    if (this.form.invalid) return;
    const { email, password, firstName, lastName } = this.form.getRawValue();
    this.isSubmitting.set(true);
    this.error.set(undefined);
    try {
      await this.authFacade.register(email, password, firstName, lastName);
      this.router.navigate(['/']);
    } catch {
      this.error.set('Could not create account. That email may already be registered.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
