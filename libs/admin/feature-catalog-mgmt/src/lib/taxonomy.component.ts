import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TaxonomyFacade } from './taxonomy.facade';

@Component({
  selector: 'beauty-admin-taxonomy',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <h1>Categories & Brands</h1>

    <section>
      <h2>Categories</h2>
      <ul>
        @for (category of facade.categories(); track category.id) {
          <li>
            {{ category.name }}
            @if (category.children?.length) {
              <ul>
                @for (child of category.children; track child.id) {
                  <li>{{ child.name }}</li>
                }
              </ul>
            }
          </li>
        }
      </ul>
      <form [formGroup]="categoryForm" (ngSubmit)="onCreateCategory()">
        <input formControlName="name" placeholder="Category name" />
        <input formControlName="slug" placeholder="category-slug" />
        <button type="submit" [disabled]="categoryForm.invalid">Add category</button>
      </form>
    </section>

    <section>
      <h2>Brands</h2>
      <ul>
        @for (brand of facade.brands(); track brand.id) {
          <li>{{ brand.name }}</li>
        }
      </ul>
      <form [formGroup]="brandForm" (ngSubmit)="onCreateBrand()">
        <input formControlName="name" placeholder="Brand name" />
        <input formControlName="slug" placeholder="brand-slug" />
        <button type="submit" [disabled]="brandForm.invalid">Add brand</button>
      </form>
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
