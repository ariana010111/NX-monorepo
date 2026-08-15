import { Injectable, computed, inject, signal } from '@angular/core';
import { BeautyPlatformAPIService, UserResponseDto } from '@beauty-platform-validated/api-client';

const TOKEN_STORAGE_KEY = 'beauty_platform_access_token';
const USER_STORAGE_KEY = 'beauty_platform_user';

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

  private readonly _token = signal<string | null>(this.readStoredToken());
  private readonly _user = signal<UserResponseDto | null>(this.readStoredUser());

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);
  readonly isAdmin = computed(() => this._user()?.roles.includes('SUPER_ADMIN') ?? false);

  async login(email: string, password: string) {
    const response = await new Promise<{ accessToken: string; user: UserResponseDto }>((resolve, reject) =>
      this.api.authControllerLogin({ email, password }).subscribe({ next: resolve, error: reject }),
    );
    this.setSession(response.accessToken, response.user);
  }

  async register(email: string, password: string, firstName: string, lastName: string) {
    const response = await new Promise<{ accessToken: string; user: UserResponseDto }>((resolve, reject) =>
      this.api.authControllerRegister({ email, password, firstName, lastName }).subscribe({ next: resolve, error: reject }),
    );
    this.setSession(response.accessToken, response.user);
  }

  logout() {
    this._token.set(null);
    this._user.set(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  private setSession(token: string, user: UserResponseDto) {
    this._token.set(token);
    this._user.set(user);
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }

  private readStoredToken(): string | null {
    if (typeof localStorage === 'undefined') return null; // SSR guard
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  private readStoredUser(): UserResponseDto | null {
    if (typeof localStorage === 'undefined') return null; // SSR guard
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
