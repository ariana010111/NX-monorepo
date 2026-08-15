import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductDetailComponent } from './product-detail.component';

describe('ProductDetailComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetailComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });

  it('should create with a slug input', () => {
    const fixture = TestBed.createComponent(ProductDetailComponent);
    fixture.componentRef.setInput('slug', 'velvet-matte-lipstick');
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('starts with no attribute selected and no matching variant', () => {
    const fixture = TestBed.createComponent(ProductDetailComponent);
    fixture.componentRef.setInput('slug', 'velvet-matte-lipstick');
    expect(fixture.componentInstance.selectedVariant()).toBeUndefined();
  });
});
