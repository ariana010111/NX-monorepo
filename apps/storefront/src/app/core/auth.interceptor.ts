import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthFacade } from '@beauty-platform-validated/storefront-data-access';

/** Attaches the bearer token to every outgoing request, when present. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthFacade).token();
  if (!token) return next(req);
  return next(req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};
