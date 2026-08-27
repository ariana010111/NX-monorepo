import { Injectable, computed, inject, signal } from '@angular/core';
import { BeautyPlatformAPIService, UserResponseDto } from '@beauty-platform-validated/api-client';

const TOKEN_STORAGE_KEY = 'beauty_platform_admin_token';
const REFRESH_TOKEN_STORAGE_KEY = 'beauty_platform_admin_refresh_token';
const USER_STORAGE_KEY = 'beauty_platform_admin_user';

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: UserResponseDto;
}

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

  private readonly _token = signal<string | null>(this.readStored(TOKEN_STORAGE_KEY));
  private readonly _refreshToken = signal<string | null>(this.readStored(REFRESH_TOKEN_STORAGE_KEY));
  private readonly _user = signal<UserResponseDto | null>(this.readStoredUser());

  readonly token = this._token.asReadonly();
  readonly user = this._user.asReadonly();
  readonly isAuthenticated = computed(() => this._token() !== null);
  readonly isAdmin = computed(() => this._user()?.roles.some((role) => ['SUPERADMIN', 'SUPER_ADMIN', 'ADMIN', 'STAFF'].includes(role)) ?? false);
  hasPermission(permission: string) {
    const user = this._user();
    return user?.roles.some((role) => role === 'SUPERADMIN' || role === 'SUPER_ADMIN') || user?.permissions?.includes(permission) || false;
  }

  async login(email: string, password: string) {
    const response = await new Promise<AuthResult>((resolve, reject) =>
      this.api.authControllerLogin({ email, password }).subscribe({ next: resolve, error: reject }),
    );
    this.setSession(response);
  }

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
      this.clearSession();
      return false;
    }
  }

  logout() {
    const currentRefreshToken = this._refreshToken();
    this.clearSession();
    if (currentRefreshToken) {
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
    if (typeof localStorage === 'undefined') return null;
    return localStorage.getItem(key);
  }

  private readStoredUser(): UserResponseDto | null {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  }
}
