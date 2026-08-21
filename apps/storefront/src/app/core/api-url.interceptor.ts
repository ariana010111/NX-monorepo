import { HttpInterceptorFn } from '@angular/common/http';

/**
 * The Orval-generated client (libs/shared/api-client) emits bare relative
 * paths like `/products` — no host, no `/api` prefix. Left alone, a real
 * browser resolves that against the Angular app's own origin
 * (http://localhost:4200/products), not the NestJS API
 * (http://localhost:3000/api/products) — a request that 404s or gets
 * swallowed by Angular's own router, not the backend. This interceptor is
 * what actually makes admin-writes-visible-to-customer-reads work at all
 * outside of the in-process supertest verification used during development.
 *
 * TODO: move API_BASE_URL to a real environment.ts (dev/prod file
 * replacement) before this goes anywhere near a real deployment — a
 * hardcoded localhost URL obviously cannot work in production.
 */
const API_BASE_URL = 'http://localhost:3000/api';

export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.startsWith('http://') || req.url.startsWith('https://')) {
    return next(req); // already absolute — leave it alone
  }
  return next(req.clone({ url: `${API_BASE_URL}${req.url}` }));
};
