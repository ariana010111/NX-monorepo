import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { PageViewService } from './page-view.service';

/**
 * Tests use a mock Router whose `events` Subject we control directly.
 * This avoids the complexity of a real router navigation cycle in a unit test
 * while still exercising the exact filtering and HTTP logic in the service.
 */
function makeRouterStub() {
  const events$ = new Subject<unknown>();
  return { router: { events: events$.asObservable() }, events$ };
}

describe('PageViewService', () => {
  describe('browser platform', () => {
    let service: PageViewService;
    let httpMock: HttpTestingController;
    let events$: Subject<unknown>;

    beforeEach(() => {
      const { router, events$: es } = makeRouterStub();
      events$ = es;

      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: Router, useValue: router },
        ],
      });
      service = TestBed.inject(PageViewService);
      httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('POSTs to /visits with the navigated path on each NavigationEnd', () => {
      service.init();

      events$.next(new NavigationEnd(1, '/wishlist', '/wishlist'));

      const req = httpMock.expectOne((r) => r.url.includes('/visits'));
      expect(req.request.method).toBe('POST');
      expect((req.request.body as { path: string }).path).toBe('/wishlist');
      req.flush(null);
    });

    it('uses urlAfterRedirects — records the final URL, not the requested URL', () => {
      service.init();

      events$.next(new NavigationEnd(2, '/old-path', '/new-path'));

      const req = httpMock.expectOne((r) => r.url.includes('/visits'));
      expect((req.request.body as { path: string }).path).toBe('/new-path');
      req.flush(null);
    });

    it('swallows HTTP errors — a failed visit POST never throws or blocks navigation', () => {
      service.init();

      events$.next(new NavigationEnd(3, '/cart', '/cart'));

      const req = httpMock.expectOne((r) => r.url.includes('/visits'));
      // Simulating a network error must not propagate to the router subscriber.
      expect(() => req.error(new ProgressEvent('error'))).not.toThrow();
    });

    it('does NOT POST when init() has not been called yet', () => {
      // Do NOT call service.init()
      events$.next(new NavigationEnd(4, '/products', '/products'));
      httpMock.expectNone((r) => r.url.includes('/visits'));
    });
  });

  describe('server platform (SSR)', () => {
    it('does not POST /visits at all — init() exits before subscribing to router events', () => {
      const { router, events$ } = makeRouterStub();

      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: Router, useValue: router },
        ],
      });

      const service = TestBed.inject(PageViewService);
      const httpMock = TestBed.inject(HttpTestingController);

      service.init();
      events$.next(new NavigationEnd(1, '/', '/'));

      httpMock.expectNone((r) => r.url.includes('/visits'));
      httpMock.verify();
    });
  });
});
