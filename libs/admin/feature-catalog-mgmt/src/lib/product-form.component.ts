import { Component, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource } from '@angular/core/rxjs-interop';
import { ProductsAdminApiService } from '@beauty-platform-validated/admin-data-access';
import { UpdateProductDtoStatus } from '@beauty-platform-validated/api-client';

/**
 * Reactive Forms owns this component's state, per the state-layer rules —
 * no mirroring form values into signals. The form group IS the state until
 * submit; only the loaded-product fetch (for edit mode) is server state.
 *
 * Variant/image sections are minimal, unstyled markup — functional wiring
 * only, per direct instruction that UI/CSS is being handled separately.
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

    @if (id()) {
      <section>
        <h2>Variants</h2>
        @for (variant of existingProduct.value()?.variants; track variant.id) {
          <div>{{ variant.sku }} — {{ variant.attributes[0]?.value }} — {{ variant.price }}</div>
        }
        <form [formGroup]="variantForm" (ngSubmit)="onAddVariant()">
          <input formControlName="sku" placeholder="SKU" />
          <input formControlName="price" type="number" placeholder="Price" />
          <input formControlName="attributeName" placeholder="Attribute name (e.g. Shade)" />
          <input formControlName="attributeValue" placeholder="Attribute value (e.g. Rosy Pink)" />
          <input formControlName="initialStock" type="number" placeholder="Initial stock" />
          @if (variantError(); as err) {
            <p role="alert">{{ err }}</p>
          }
          <button type="submit" [disabled]="variantForm.invalid">Add variant</button>
        </form>
      </section>

      <section>
        <h2>Images</h2>
        @for (image of existingProduct.value()?.images; track image.url) {
          <div>{{ image.url }}</div>
        }
        <form [formGroup]="imageForm" (ngSubmit)="onAddImage()">
          <input formControlName="url" placeholder="Image URL" />
          <button type="submit" [disabled]="imageForm.invalid">Add image</button>
        </form>
      </section>
    }
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

  readonly variantForm = this.fb.nonNullable.group({
    sku: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0.01)]],
    attributeName: ['Shade', Validators.required],
    attributeValue: ['', Validators.required],
    initialStock: [0, Validators.min(0)],
  });
  readonly variantError = signal<string | undefined>(undefined);

  readonly imageForm = this.fb.nonNullable.group({
    url: ['', [Validators.required, Validators.pattern(/^https?:\/\//)]],
  });

  readonly existingProduct = rxResource({
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
      this.router.navigate(['/products']);
    } else {
      // Navigate to the edit page for the newly-created product, not back
      // to the list — a brand-new product has zero variants and is
      // unpurchasable until at least one is added, so the natural next
      // step is right here, not somewhere the admin has to re-find it.
      const created = await new Promise<{ id: string }>((resolve, reject) =>
        this.productsApi
          .create({ name: value.name, slug: value.slug, description: value.description })
          .subscribe({ next: resolve, error: reject }),
      );
      this.router.navigate(['/products', created.id, 'edit']);
    }
  }

  async onAddVariant() {
    const productId = this.id();
    if (!productId || this.variantForm.invalid) return;
    this.variantError.set(undefined);
    const value = this.variantForm.getRawValue();
    try {
      await new Promise((resolve, reject) =>
        this.productsApi
          .addVariant(productId, {
            sku: value.sku,
            price: value.price,
            attributes: [{ attributeName: value.attributeName, value: value.attributeValue }],
            initialStock: value.initialStock,
          })
          .subscribe({ next: resolve, error: reject }),
      );
      this.variantForm.reset({ sku: '', price: 0, attributeName: 'Shade', attributeValue: '', initialStock: 0 });
      this.existingProduct.reload();
    } catch (err: unknown) {
      const message = (err as { error?: { message?: string } })?.error?.message;
      this.variantError.set(message ?? 'Could not add variant.');
    }
  }

  async onAddImage() {
    const productId = this.id();
    if (!productId || this.imageForm.invalid) return;
    const { url } = this.imageForm.getRawValue();
    await new Promise((resolve, reject) =>
      this.productsApi.addImage(productId, { url }).subscribe({ next: resolve, error: reject }),
    );
    this.imageForm.reset({ url: '' });
    this.existingProduct.reload();
  }
}
