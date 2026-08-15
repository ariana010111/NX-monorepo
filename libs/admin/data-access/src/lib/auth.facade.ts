import { Injectable, computed, inject, signal } from '@angular/core';
import { BeautyPlatformAPIService, UserResponseDto } from '@beauty-platform-validated/api-client';

const TOKEN_STORAGE_KEY = 'beauty_platform_admin_token';
const USER_STORAGE_KEY = 'beauty_platform_admin_user';

/**
 * Admin has its own AuthFacade, deliberately separate from the storefront's
 * — different storage keys (an admin session must never be readable by
 * storefront code even though both apps could theoretically share a
 * browser profile), and no register() at all. Admin accounts are
 * provisioned directly (see UsersRepository's seeded account), not
 * self-service — this mirrors real admin-panel practice.
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
    this._token.set(response.accessToken);
    this._user.set(response.user);
    localStorage.setItem(TOKEN_STORAGE_KEY, response.accessToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
  }

  logout() {
    this._token.set(null);
    this._user.set(null);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
  }

  private readStoredToken(): string | null {
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  private readStoredUser(): UserResponseDto | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
