import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideRouter } from '@angular/router';
import { Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthFacade } from '@beauty-platform-validated/storefront-data-access';

describe('LoginComponent', () => {
  let authFacadeMock: { login: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    authFacadeMock = { login: vi.fn() };
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [provideRouter([]), { provide: AuthFacade, useValue: authFacadeMock }],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('does not call login when the form is invalid', () => {
    const fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.onSubmit();
    expect(authFacadeMock.login).not.toHaveBeenCalled();
  });

  it('calls AuthFacade.login with the form values and navigates home on success', async () => {
    authFacadeMock.login.mockResolvedValue(undefined);
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.form.setValue({ email: 'user@example.com', password: 'password123' });

    await fixture.componentInstance.onSubmit();

    expect(authFacadeMock.login).toHaveBeenCalledWith('user@example.com', 'password123');
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });

  it('sets an error message and does not navigate when login rejects', async () => {
    authFacadeMock.login.mockRejectedValue(new Error('Unauthorized'));
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate');

    const fixture = TestBed.createComponent(LoginComponent);
    fixture.componentInstance.form.setValue({ email: 'user@example.com', password: 'wrong' });

    await fixture.componentInstance.onSubmit();

    expect(fixture.componentInstance.error()).toBeTruthy();
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('navigates to returnUrl when provided in query params', async () => {
    authFacadeMock.login.mockResolvedValue(undefined);
    const router = TestBed.inject(Router);
    const navigateByUrlSpy = vi.spyOn(router, 'navigateByUrl');

    const fixture = TestBed.createComponent(LoginComponent);
    vi.spyOn(fixture.componentInstance, 'returnUrl', 'get').mockReturnValue('/checkout');
    fixture.componentInstance.form.setValue({ email: 'user@example.com', password: 'password123' });

    await fixture.componentInstance.onSubmit();

    expect(navigateByUrlSpy).toHaveBeenCalledWith('/checkout');
  });
});
