import { Route } from '@angular/router';
import { CartPageComponent } from '@beauty-platform-validated/storefront-feature-cart';
import { CatalogFacade, CatalogListComponent, ProductDetailComponent } from '@beauty-platform-validated/storefront-feature-catalog';
import { CheckoutFacade, CheckoutComponent } from '@beauty-platform-validated/storefront-feature-checkout';

export const appRoutes: Route[] = [
  { path: '', component: CatalogListComponent, providers: [CatalogFacade] },
  { path: 'products/:slug', component: ProductDetailComponent },
  // CartFacade is NOT provided here — it's providedIn: 'root' (see
  // storefront-data-access/cart.facade.ts) precisely because this route,
  // the PDP route above, and the checkout route below all need to share
  // the same instance.
  { path: 'cart', component: CartPageComponent },
  { path: 'checkout', component: CheckoutComponent, providers: [CheckoutFacade] },
];
