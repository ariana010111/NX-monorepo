import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthFacade, UsersAdminApiService } from '@beauty-platform-validated/admin-data-access';
import { CreateManagedUserDtoRole } from '@beauty-platform-validated/api-client';

@Component({
  selector: 'beauty-admin-user-add',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="admin-panel" style="max-width: 720px;">
      <div class="beauty-section-head">
        <h2>Add User</h2>
        <a class="beauty-btn beauty-btn--secondary" routerLink="/users">Back to users</a>
      </div>

      <form [formGroup]="createForm" (ngSubmit)="createUser()" class="form-grid">
        <div class="field"><label>Email</label><input type="email" formControlName="email" /></div>
        <div class="field"><label>Password</label><input type="password" formControlName="password" /></div>
        <div class="field"><label>First name</label><input formControlName="firstName" /></div>
        <div class="field"><label>Last name</label><input formControlName="lastName" /></div>
        <div class="field" style="grid-column: 1 / -1;"><label>Role</label>
          <select formControlName="role">
            @for (role of availableRoles; track role) { <option [value]="role">{{ role }}</option> }
          </select>
        </div>
        <div class="form-actions" style="grid-column: 1 / -1; justify-content: flex-start;">
          <button class="beauty-btn beauty-btn--primary" type="submit" [disabled]="createForm.invalid || isSaving">
            {{ isSaving ? 'Creating...' : 'Create user' }}
          </button>
        </div>
        @if (message) { <p role="status" style="grid-column: 1 / -1;">{{ message }}</p> }
        @if (errorMessage) { <p role="alert" style="grid-column: 1 / -1;">{{ errorMessage }}</p> }
      </form>
    </section>
  `,
})
export class UserAddComponent {
  private readonly usersApi = inject(UsersAdminApiService);
  private readonly authFacade = inject(AuthFacade);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly availableRoles: CreateManagedUserDtoRole[] = this.authFacade.hasPermission('users:create:admin')
    ? [CreateManagedUserDtoRole.ADMIN, CreateManagedUserDtoRole.STAFF, CreateManagedUserDtoRole.CUSTOMER]
    : [CreateManagedUserDtoRole.STAFF, CreateManagedUserDtoRole.CUSTOMER];
  readonly createForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    role: [this.availableRoles[0], Validators.required],
  });
  isSaving = false;
  message = '';
  errorMessage = '';

  async createUser() {
    if (this.createForm.invalid || this.isSaving) return;
    this.isSaving = true;
    this.message = '';
    this.errorMessage = '';
    try {
      await firstValueFrom(this.usersApi.create(this.createForm.getRawValue()));
      await this.router.navigate(['/users']);
    } catch {
      this.errorMessage = 'Unable to create user. Check the details and your permissions.';
    } finally {
      this.isSaving = false;
    }
  }
}
