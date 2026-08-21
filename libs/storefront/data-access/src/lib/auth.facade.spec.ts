import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AuthFacade } from './auth.facade';

describe('AuthFacade', () => {
  let facade: AuthFacade;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    facade = TestBed.inject(AuthFacade);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('starts unauthenticated with no stored session', () => {
    expect(facade.isAuthenticated()).toBe(false);
    expect(facade.user()).toBeNull();
  });

  it('becomes authenticated after a successful login and persists to localStorage', async () => {
    const loginPromise = facade.login('user@example.com', 'password123');

    const req = httpMock.expectOne((r) => r.url.includes('/auth/login'));
    req.flush({
      accessToken: 'fake.jwt.token',
      user: { id: 'u1', email: 'user@example.com', firstName: 'A', lastName: 'B', roles: ['CUSTOMER'] },
    });
    await loginPromise;

    expect(facade.isAuthenticated()).toBe(true);
    expect(facade.token()).toBe('fake.jwt.token');
    expect(localStorage.getItem('beauty_platform_access_token')).toBe('fake.jwt.token');
  });

  it('computes isAdmin correctly based on the roles on the logged-in user', async () => {
    const loginPromise = facade.login('admin@example.com', 'password123');
    const req = httpMock.expectOne((r) => r.url.includes('/auth/login'));
    req.flush({
      accessToken: 'fake.jwt.token',
      user: { id: 'u1', email: 'admin@example.com', firstName: 'A', lastName: 'B', roles: ['SUPER_ADMIN'] },
    });
    await loginPromise;

    expect(facade.isAdmin()).toBe(true);
  });

  it('clears state and localStorage on logout', async () => {
    const loginPromise = facade.login('user@example.com', 'password123');
    const req = httpMock.expectOne((r) => r.url.includes('/auth/login'));
    req.flush({
      accessToken: 'fake.jwt.token',
      user: { id: 'u1', email: 'user@example.com', firstName: 'A', lastName: 'B', roles: ['CUSTOMER'] },
    });
    await loginPromise;

    facade.logout();

    expect(facade.isAuthenticated()).toBe(false);
    expect(localStorage.getItem('beauty_platform_access_token')).toBeNull();
  });
});
