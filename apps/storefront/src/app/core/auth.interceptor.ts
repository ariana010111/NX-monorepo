import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, from, switchMap, throwError } from 'rxjs';
import { AuthFacade } from '@beauty-platform-validated/storefront-data-access';

/**
 * Attaches the bearer token to every outgoing request, and on a 401
 * attempts exactly ONE silent refresh-and-retry before giving up. This is
 * what makes the refresh token endpoint actually useful day to day rather
 * than just theoretically available — without this, an expired 1-hour
 * access token means every request just fails until the user manually
 * logs in again, refresh token or not.
 *
 * Does NOT attempt to refresh for requests to /auth/* itself — retrying a
 * failed login or a failed refresh with ANOTHER refresh call would be
 * either meaningless or an infinite loop.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authFacade = inject(AuthFacade);
  const token = authFacade.token();
  const authedReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authedReq).pipe(
    catchError((error: unknown) => {
      const isAuthEndpoint = req.url.includes('/auth/');
      if (error instanceof HttpErrorResponse && error.status === 401 && !isAuthEndpoint) {
        return from(authFacade.refresh()).pipe(
          switchMap((refreshed) => {
            if (!refreshed) return throwError(() => error);
            const retriedReq = req.clone({ setHeaders: { Authorization: `Bearer ${authFacade.token()}` } });
            return next(retriedReq);
          }),
        );
      }
      return throwError(() => error);
    }),
  );
};
