import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

/**
 * Shape of the POST /visits request body (Day 1 API).
 * TODO(orval-regen): replace with the generated RecordVisitDto once the
 * OpenAPI spec is regenerated and the orval client updated.  This local
 * interface is intentionally minimal — add sessionId / userId when the API
 * contract confirms those fields.
 */
export interface RecordVisitDto {
  path: string;
  /** Omitted entirely when the document has no referrer. */
  referrer?: string;
}

/**
 * Instruments every client-side route transition by posting to POST /visits.
 *
 * SSR safety: `init()` returns immediately when called on the server
 * (PLATFORM_ID === 'server'), so no DOM access, no document.referrer read,
 * and no HTTP call ever happen during prerendering or server-side rendering.
 *
 * Failure isolation: the HTTP error handler is a no-op — a degraded or
 * slow analytics endpoint never blocks, errors, or delays a navigation.
 *
 * Startup: call `init()` once at application boot from the root App
 * component or app.config.ts.  The service is root-provided but lazy; it
 * does nothing until `init()` is called.
 *
 * TODO(orval-regen): replace the bare HttpClient call with
 *   this.generated.visitsControllerCreate(dto)
 * once the generated client has the method.
 */
@Injectable({ providedIn: 'root' })
export class PageViewService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  init(): void {
    // Hard SSR guard — nothing past this line runs on the server.
    if (!isPlatformBrowser(this.platformId)) return;

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        const dto: RecordVisitDto = {
          path: e.urlAfterRedirects,
          // document is guaranteed to exist here because of the isPlatformBrowser guard above.
          referrer: document.referrer || undefined,
        };
        // TODO(orval-regen): replace with this.generated.visitsControllerCreate(dto)
        this.http.post('/visits', dto).subscribe({ error: () => undefined });
      });
  }
}
