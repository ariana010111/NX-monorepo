import { TestBed } from '@angular/core/testing';
import { CartPageComponent } from './cart-page.component';
import { CartFacade } from '@beauty-platform-validated/storefront-data-access';

describe('CartPageComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CartPageComponent] }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(CartPageComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('reflects items added via the shared root-provided CartFacade', () => {
    const fixture = TestBed.createComponent(CartPageComponent);
    const facade = TestBed.inject(CartFacade);
    facade.addItem({ variantId: 'v1', name: 'Lipstick', shade: 'Rosy Pink', quantity: 1, unitPrice: 24 });
    fixture.detectChanges();
    expect(fixture.componentInstance.facade.itemCount()).toBe(1);
  });
});
