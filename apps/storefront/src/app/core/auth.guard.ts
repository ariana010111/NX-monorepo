import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthFacade } from '@beauty-platform-validated/storefront-data-access';

/**
 * Client-side UX gate only — redirects a logged-out visitor to /login
 * instead of showing an empty/broken order-history page. The real
 * enforcement is server-side: GET /orders/me requires a valid JWT
 * regardless of what this guard does (verified in the coupon/ownership
 * smoke test — a request with no token gets a real 401).
 */
export const authGuard: CanActivateFn = () => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);
  if (authFacade.isAuthenticated()) return true;
  router.navigate(['/login']);
  return false;
};
