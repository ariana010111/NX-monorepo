import { Injectable, computed, inject, signal } from '@angular/core';
import { BeautyPlatformAPIService, UserResponseDto } from '@beauty-platform-validated/api-client';

const TOKEN_STORAGE_KEY = 'beauty_platform_access_token';
const REFRESH_TOKEN_STORAGE_KEY = 'beauty_platform_refresh_token';
const USER_STORAGE_KEY = 'beauty_platform_user';

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: UserResponseDto;
}

/**
 * Root-provided, same reasoning as CartFacade/WishlistFacade — auth state
 * is needed everywhere (nav, checkout, guarded routes), so it can't be
 * feature-scoped. Persists to localStorage so a page refresh doesn't log
 * the user out; this is a real browser app (not a claude.ai artifact), so
 * localStorage is the right tool here.
 */
@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly api = inject(BeautyPlatformAPIService);

  private readonly _token = signal<string | null>(this.readStored(TOKEN_STORAGE_KEY));
  private readonly _refreshToken = signal<string | null>(this.readStored(REFRESH_TOKEN_STORAGE_KEY));
  private readonly _user = signal<UserResponseDto | null>(this.readStoredUser());

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);
  readonly isAdmin = computed(() => this._user()?.roles.includes('SUPER_ADMIN') ?? false);

  async login(email: string, password: string) {
    const response = await new Promise<AuthResult>((resolve, reject) =>
      this.api.authControllerLogin({ email, password }).subscribe({ next: resolve, error: reject }),
    );
    this.setSession(response);
  }

  async register(email: string, password: string, firstName: string, lastName: string) {
    const response = await new Promise<AuthResult>((resolve, reject) =>
      this.api.authControllerRegister({ email, password, firstName, lastName }).subscribe({ next: resolve, error: reject }),
    );
    this.setSession(response);
  }

  /**
   * Exchanges the current refresh token for a new access + refresh token
   * pair. The API rotates on every use (old refresh token is revoked the
   * moment this succeeds) — callers must always store whatever comes back,
   * never keep reusing the token they sent in.
   */
  async refresh(): Promise<boolean> {
    const currentRefreshToken = this._refreshToken();
    if (!currentRefreshToken) return false;
    try {
      const response = await new Promise<AuthResult>((resolve, reject) =>
        this.api.authControllerRefresh({ refreshToken: currentRefreshToken }).subscribe({ next: resolve, error: reject }),
      );
      this.setSession(response);
      return true;
    } catch {
      // The refresh token itself is invalid/expired/already used — the
      // session is unrecoverable, clear it rather than leaving stale
      // tokens around that will just fail again next time.
      this.clearSession();
      return false;
    }
  }

  logout() {
    const currentRefreshToken = this._refreshToken();
    this.clearSession();
    if (currentRefreshToken) {
      // Best-effort server-side revocation — the local session is already
      // cleared either way, so a network failure here shouldn't block
      // logout from the user's perspective.
      this.api.authControllerLogout({ refreshToken: currentRefreshToken }).subscribe({ error: () => undefined });
    }
  }

  private setSession(response: AuthResult) {
    this._token.set(response.accessToken);
    this._refreshToken.set(response.refreshToken);
    this._user.set(response.user);
    localStorage.setItem(TOKEN_STORAGE_KEY, response.accessToken);
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, response.refreshToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
  }

  private clearSession() {
    this._token.set(null);
    this._refreshToken.set(null);
    this._user.set(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  private readStored(key: string): string | null {
    if (typeof localStorage === 'undefined') return null; // SSR guard
    return localStorage.getItem(key);
  }

  private readStoredUser(): UserResponseDto | null {
    if (typeof localStorage === 'undefined') return null; // SSR guard
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
