import { Route } from '@angular/router';
import { CartPageComponent } from '@beauty-platform-validated/storefront-feature-cart';
import {
  CatalogFacade,
  CatalogListComponent,
  ProductDetailComponent,
  WishlistPageComponent,
} from '@beauty-platform-validated/storefront-feature-catalog';
import { CheckoutFacade, CheckoutComponent } from '@beauty-platform-validated/storefront-feature-checkout';
import { LoginComponent, RegisterComponent } from '@beauty-platform-validated/storefront-feature-account';

export const appRoutes: Route[] = [
  { path: '', component: CatalogListComponent, providers: [CatalogFacade] },
  { path: 'products/:slug', component: ProductDetailComponent },
  // CartFacade, WishlistFacade, and AuthFacade are NOT provided here —
  // all three are providedIn: 'root' (see storefront-data-access)
  // precisely because multiple routes need to share the same instance.
  { path: 'cart', component: CartPageComponent },
  { path: 'wishlist', component: WishlistPageComponent },
  { path: 'checkout', component: CheckoutComponent, providers: [CheckoutFacade] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
];
