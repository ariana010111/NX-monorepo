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
    <section class="admin-panel">
      <div class="beauty-section-head">
        <h2>{{ id() ? 'Edit product' : 'New product' }}</h2>
      </div>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-grid">
        <div class="field" style="grid-column: 1 / -1;"><label>Name</label><input formControlName="name" /></div>
        @if (form.controls.name.invalid && form.controls.name.touched) {
          <p style="grid-column: 1 / -1;">Name must be at least 2 characters.</p>
        }

        @if (!id()) {
          <div class="field" style="grid-column: 1 / -1;"><label>Slug</label><input formControlName="slug" /></div>
        }

        <div class="field" style="grid-column: 1 / -1;"><label>Short description</label><input formControlName="shortDescription" /></div>
        <div class="field" style="grid-column: 1 / -1;"><label>Description</label><textarea formControlName="description"></textarea></div>

        @if (id()) {
          <div class="field" style="grid-column: 1 / -1;"><label>Status</label>
            <select formControlName="status">
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        }

        <div class="form-actions" style="grid-column: 1 / -1; justify-content: flex-start;">
          <button class="beauty-btn beauty-btn--primary" type="submit" [disabled]="form.invalid">Save</button>
        </div>
      </form>

      @if (id()) {
        <div class="form-grid" style="margin-top: 28px;">
          <section class="feature-panel" style="padding: 20px;">
            <h3>Variants</h3>
            @for (variant of existingProduct.value()?.variants; track variant.id) {
              <div style="padding: 10px 0; border-bottom: 1px solid var(--beauty-border);">{{ variant.sku }} — {{ variant.attributes[0]?.value }} — {{ variant.price }}</div>
            }
            <form [formGroup]="variantForm" (ngSubmit)="onAddVariant()" class="form-grid" style="margin-top: 16px; grid-template-columns: repeat(2, minmax(0, 1fr)); align-items: end;">
              <div class="field"><input formControlName="sku" placeholder="SKU" /></div>
              <div class="field"><input formControlName="price" type="number" placeholder="Price" /></div>
              <div class="field"><input formControlName="attributeName" placeholder="Attribute name (e.g. Shade)" /></div>
              <div class="field"><input formControlName="attributeValue" placeholder="Attribute value (e.g. Rosy Pink)" /></div>
              <div class="field"><input formControlName="initialStock" type="number" placeholder="Initial stock" /></div>
              <div class="field"><button class="beauty-btn beauty-btn--primary" type="submit" [disabled]="variantForm.invalid">Add variant</button></div>
              @if (variantError(); as err) {
                <p role="alert" style="grid-column: 1 / -1;">{{ err }}</p>
              }
            </form>
          </section>

          <section class="feature-panel" style="padding: 20px;">
            <h3>Images</h3>
            @for (image of existingProduct.value()?.images; track image.url) {
              <div style="padding: 10px 0; border-bottom: 1px solid var(--beauty-border);">{{ image.url }}</div>
            }
            <div style="display: flex; gap: 8px; margin-top: 16px;">
              <button
                type="button"
                class="beauty-btn"
                [class.beauty-btn--primary]="imageMode() === 'attach'"
                [class.beauty-btn--secondary]="imageMode() === 'url'"
                (click)="setImageMode('attach')"
              >
                Attach
              </button>
              <button
                type="button"
                class="beauty-btn"
                [class.beauty-btn--primary]="imageMode() === 'url'"
                [class.beauty-btn--secondary]="imageMode() === 'attach'"
                (click)="setImageMode('url')"
              >
                Paste URL
              </button>
            </div>
            <form [formGroup]="imageForm" (ngSubmit)="onAddImage()" class="form-grid" style="margin-top: 12px; grid-template-columns: 1fr auto; align-items: end;">
              @if (imageMode() === 'attach') {
                <div class="field">
                  <input type="file" accept="image/*" (change)="onImageFileSelected($event)" />
                  @if (imageFileName(); as name) {
                    <small style="color: var(--beauty-text-secondary);">{{ name }}</small>
                  }
                </div>
              } @else {
                <div class="field"><input formControlName="url" placeholder="https://example.com/image.jpg" /></div>
              }
              <button class="beauty-btn beauty-btn--primary" type="submit" [disabled]="imageForm.invalid">Add image</button>
              @if (imageError(); as err) {
                <p role="alert" style="grid-column: 1 / -1;">{{ err }}</p>
              }
            </form>
          </section>
        </div>
      }
    </section>
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

  // Accepts either a pasted http(s) URL or a data: URI produced by reading
  // a locally-attached file — both are valid values for the same field.
  readonly imageForm = this.fb.nonNullable.group({
    url: ['', [Validators.required, Validators.pattern(/^(https?:\/\/|data:image\/)/)]],
  });

  readonly imageMode = signal<'attach' | 'url'>('attach');
  readonly imageFileName = signal<string | undefined>(undefined);
  readonly imageError = signal<string | undefined>(undefined);
  private static readonly MAX_IMAGE_BYTES = 4 * 1024 * 1024;

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
    this.imageError.set(undefined);
    const { url } = this.imageForm.getRawValue();
    try {
      await new Promise((resolve, reject) =>
        this.productsApi.addImage(productId, { url }).subscribe({ next: resolve, error: reject }),
      );
      this.imageForm.reset({ url: '' });
      this.imageFileName.set(undefined);
      this.existingProduct.reload();
    } catch (err: unknown) {
      const message = (err as { error?: { message?: string } })?.error?.message;
      this.imageError.set(message ?? 'Could not add image. Try a smaller file or a direct URL.');
    }
  }

  setImageMode(mode: 'attach' | 'url') {
    this.imageMode.set(mode);
    this.imageFileName.set(undefined);
    this.imageError.set(undefined);
    this.imageForm.reset({ url: '' });
  }

  onImageFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.imageError.set(undefined);
    if (file.size > ProductFormComponent.MAX_IMAGE_BYTES) {
      this.imageError.set('Image is too large — please choose a file under 4MB.');
      this.imageFileName.set(undefined);
      input.value = '';
      return;
    }
    this.imageFileName.set(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      this.imageForm.patchValue({ url: reader.result as string });
      this.imageForm.controls.url.markAsTouched();
    };
    reader.readAsDataURL(file);
  }
}
