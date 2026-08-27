import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaxonomyFacade } from './taxonomy.facade';

@Component({
  selector: 'beauty-admin-taxonomy',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="admin-panel">
      <div class="beauty-section-head">
        <h2>Categories & Brands</h2>
      </div>

      <div class="form-grid" style="margin-bottom: 24px;">
        <section class="feature-panel" style="padding: 20px;">
          <h3>Categories</h3>
          <ul>
            @for (category of facade.categories(); track category.id) {
              <li style="display:flex; justify-content:space-between; gap:12px; padding:10px 0; border-bottom:1px solid var(--beauty-border);">
                <span>{{ category.name }}</span>
                <button class="beauty-btn beauty-btn--secondary" type="button" (click)="facade.deleteCategory(category.id)">Delete</button>
              </li>
            }
          </ul>
          <form [formGroup]="categoryForm" (ngSubmit)="onCreateCategory()" class="form-grid" style="margin-top: 16px; grid-template-columns: 1fr 1fr auto; align-items: end;">
            <div class="field"><input formControlName="name" placeholder="Category name" /></div>
            <div class="field"><input formControlName="slug" placeholder="category-slug" /></div>
            <button class="beauty-btn beauty-btn--primary" type="submit" [disabled]="categoryForm.invalid">Add</button>
          </form>
        </section>

        <section class="feature-panel" style="padding: 20px;">
          <h3>Brands</h3>
          <ul>
            @for (brand of facade.brands(); track brand.id) {
              <li style="display:flex; justify-content:space-between; gap:12px; padding:10px 0; border-bottom:1px solid var(--beauty-border);">
                <span>{{ brand.name }}</span>
                <button class="beauty-btn beauty-btn--secondary" type="button" (click)="facade.deleteBrand(brand.id)">Delete</button>
              </li>
            }
          </ul>
          <form [formGroup]="brandForm" (ngSubmit)="onCreateBrand()" class="form-grid" style="margin-top: 16px; grid-template-columns: 1fr 1fr auto; align-items: end;">
            <div class="field"><input formControlName="name" placeholder="Brand name" /></div>
            <div class="field"><input formControlName="slug" placeholder="brand-slug" /></div>
            <button class="beauty-btn beauty-btn--primary" type="submit" [disabled]="brandForm.invalid">Add</button>
          </form>
        </section>
      </div>
    </section>
  `,
})
export class TaxonomyComponent {
  readonly facade = inject(TaxonomyFacade);
  private readonly fb = inject(FormBuilder);

  readonly categoryForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    slug: ['', Validators.required],
  });

  readonly brandForm = this.fb.nonNullable.group({
    name: ['', Validators.required],
    slug: ['', Validators.required],
  });

  onCreateCategory() {
    if (this.categoryForm.invalid) return;
    const { name, slug } = this.categoryForm.getRawValue();
    this.facade.createCategory(name, slug).then(() => this.categoryForm.reset());
  }

  onCreateBrand() {
    if (this.brandForm.invalid) return;
    const { name, slug } = this.brandForm.getRawValue();
    this.facade.createBrand(name, slug).then(() => this.brandForm.reset());
  }
}
