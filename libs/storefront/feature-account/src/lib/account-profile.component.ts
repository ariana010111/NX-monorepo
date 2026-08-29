import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthFacade } from '@beauty-platform-validated/storefront-data-access';

/**
 * Authenticated customer profile page.
 *
 * Data source: AuthFacade.user() — a signal backed by localStorage.  This is
 * the correct choice here for two reasons:
 *   1. It is SSR-safe (AuthFacade's localStorage reads are guarded with
 *      `typeof localStorage === 'undefined'`, so the signal starts null on the
 *      server and hydrates on the client without a flicker or a mismatch).
 *   2. The data is fresh from the last login/refresh — identical to what is
 *      stored in the JWT, so an extra network round-trip buys nothing.
 *
 * TODO(orval-regen): once GET /profile/me is in the generated client, add an
 *   optional "Refresh from server" button that calls
 *   this.api.profileControllerGetMe() and patches the AuthFacade's user
 *   signal.  Do not make this call automatically on mount — it would fire on
 *   every route entry, including during SSR, wasting a round-trip for data we
 *   already have in the token.
 *
 * Route: /account — canActivate: [authGuard] (set in app.routes.ts).
 * SSR render mode: Server (set in app.routes.server.ts).
 */
@Component({
  selector: 'beauty-account-profile',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page-shell">
      <section class="admin-panel" style="max-width:720px;margin:0 auto">
        <div class="beauty-section-head">
          <h2>My Account</h2>
        </div>

        @if (authFacade.user(); as user) {

          <div class="feature-panel" style="padding:24px;margin-bottom:24px">
            <p class="beauty-subtle">Member account</p>
            <h1>{{ user.firstName }} {{ user.lastName }}</h1>
            <p>{{ user.email }}</p>
          </div>

          <nav aria-label="Account actions" style="display:flex;gap:12px;flex-wrap:wrap">
            <a class="beauty-btn beauty-btn--secondary" routerLink="/orders">
              Order history
            </a>
            <a class="beauty-btn beauty-btn--secondary" routerLink="/wishlist">
              Wishlist
            </a>
            <button
              type="button"
              class="beauty-btn beauty-btn--secondary"
              (click)="authFacade.logout()"
            >
              Sign out
            </button>
          </nav>

        } @else {
          <!-- Fallback: authGuard should prevent reaching here unauthenticated,
               but the check is cheap and prevents a blank page on the rare
               race where the guard fires before the session is cleared. -->
          <p>You are not signed in. <a routerLink="/login">Sign in</a></p>
        }
      </section>
    </div>
  `,
})
export class AccountProfileComponent {
  protected readonly authFacade = inject(AuthFacade);
}
