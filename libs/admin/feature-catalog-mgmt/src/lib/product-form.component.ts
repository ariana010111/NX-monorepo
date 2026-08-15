import { Component, effect, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProductsAdminApiService } from '@beauty-platform-validated/admin-data-access';
import { UpdateProductDtoStatus } from '@beauty-platform-validated/api-client';

/**
 * Reactive Forms owns this component's state, per the state-layer rules —
 * no mirroring form values into signals. The form group IS the state until
 * submit; only the loaded-product fetch (for edit mode) is server state.
 */
@Component({
  selector: 'beauty-admin-product-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <h1>{{ id() ? 'Edit product' : 'New product' }}</h1>
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <label>
        Name
        <input formControlName="name" />
      </label>
      @if (form.controls.name.invalid && form.controls.name.touched) {
        <p>Name must be at least 2 characters.</p>
      }

      @if (!id()) {
        <label>
          Slug
          <input formControlName="slug" />
        </label>
      }

      <label>
        Short description
        <input formControlName="shortDescription" />
      </label>

      <label>
        Description
        <textarea formControlName="description"></textarea>
      </label>

      @if (id()) {
        <label>
          Status
          <select formControlName="status">
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </label>
      }

      <button type="submit" [disabled]="form.invalid">Save</button>
    </form>
  `,
})
export class ProductFormComponent {
  readonly id = input<string | undefined>(undefined);

  private readonly fb = inject(FormBuilder);
  private readonly productsApi = inject(ProductsAdminApiService);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    slug: ['', Validators.required],
    shortDescription: [''],
    description: [''],
    status: this.fb.nonNullable.control<UpdateProductDtoStatus>(UpdateProductDtoStatus.DRAFT),
  });

  private readonly existingProduct = rxResource({
    params: () => (this.id() ? { id: this.id() as string } : undefined),
    stream: ({ params }) => this.productsApi.getById(params.id),
  });

  constructor() {
    // Populate the form once the existing product loads (edit mode only).
    // A plain effect, not a signal mirror — the form remains the single
    // source of truth for user edits from this point forward.
    effect(() => {
      const product = this.existingProduct.value();
      if (product) {
        this.form.patchValue({
          name: product.name,
          shortDescription: product.shortDescription,
          description: product.description,
          status: product.status as UpdateProductDtoStatus,
        });
      }
    });
  }

  async onSubmit() {
    if (this.form.invalid) return;
    const value = this.form.getRawValue();
    const currentId = this.id();

    if (currentId) {
      await new Promise((resolve, reject) =>
        this.productsApi
          .update(currentId, {
            name: value.name,
            shortDescription: value.shortDescription,
            description: value.description,
            status: value.status,
          })
          .subscribe({ next: resolve, error: reject }),
      );
    } else {
      await new Promise((resolve, reject) =>
        this.productsApi
          .create({ name: value.name, slug: value.slug, description: value.description })
          .subscribe({ next: resolve, error: reject }),
      );
    }
    this.router.navigate(['/products']);
  }
}
