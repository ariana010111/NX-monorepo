import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';
import { ProductDetailComponent } from './product-detail.component';
import { CartFacade, ProductsApiService } from '@beauty-platform-validated/storefront-data-access';

describe('ProductDetailComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ProductsApiService,
          useValue: {
            getBySlug: vi.fn().mockReturnValue(
              of({
                id: 'p-1',
                name: 'Brow Sculpt - Sculpting and Lifting Eyebrow Gel',
                slug: 'sculpting-lifting-eyebrow-gel',
                brandName: 'BeautyBloom',
                fromPrice: 24,
                description: 'Test product',
                images: [{ url: 'https://example.com/gel.jpg', altText: 'gel' }],
                variants: [],
              }),
            ),
          },
        },
      ],
    }).compileComponents();
  });

  it('should create with a slug input', () => {
    const fixture = TestBed.createComponent(ProductDetailComponent);
    fixture.componentRef.setInput('slug', 'sculpting-lifting-eyebrow-gel');
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('falls back to a product-level variant when the API returns no variant rows', async () => {
    const fixture = TestBed.createComponent(ProductDetailComponent);
    fixture.componentRef.setInput('slug', 'sculpting-lifting-eyebrow-gel');
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedVariant()).toBeTruthy();
    fixture.componentInstance.addToCart();

    const cart = TestBed.inject(CartFacade);
    expect(cart.itemCount()).toBe(1);
    expect(cart.items()[0].name).toBe('Brow Sculpt - Sculpting and Lifting Eyebrow Gel');
  });
});
