import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductFormComponent } from './product-form.component';

describe('ProductFormComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProductFormComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
  });

  it('should create in "new product" mode with an empty, invalid form', () => {
    const fixture = TestBed.createComponent(ProductFormComponent);
    expect(fixture.componentInstance).toBeTruthy();
    expect(fixture.componentInstance.form.invalid).toBe(true);
  });

  it('becomes valid once name and slug are filled in', () => {
    const fixture = TestBed.createComponent(ProductFormComponent);
    fixture.componentInstance.form.patchValue({ name: 'Velvet Matte Lipstick', slug: 'velvet-matte-lipstick' });
    expect(fixture.componentInstance.form.valid).toBe(true);
  });
});
