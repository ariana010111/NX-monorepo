import { Route } from '@angular/router';
import { CartFacade, CartPageComponent } from '@beauty-platform-validated/storefront-feature-cart';

export const appRoutes: Route[] = [
  {
    path: 'cart',
    component: CartPageComponent,
    // Facade provided HERE, at the route level - not root. Its lifetime
    // matches this route being active. See cart.facade.ts for why.
    providers: [CartFacade],
  },
];
