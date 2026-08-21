import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthFacade } from '@beauty-platform-validated/admin-data-access';

/**
 * Client-side gate for UX only (hide the nav, redirect to login) — the
 * REAL security boundary is the API's RolesGuard, which every admin
 * endpoint enforces server-side regardless of what this guard does. This
 * guard existing does not mean the API can be trusted to skip its own
 * checks; a client-side-only guard is trivially bypassed by anyone calling
 * the API directly.
 */
export const adminGuard: CanActivateFn = () => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);
  if (authFacade.isAdmin()) return true;
  router.navigate(['/login']);
  return false;
};
