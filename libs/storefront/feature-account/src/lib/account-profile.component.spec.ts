import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { AccountProfileComponent } from './account-profile.component';
import { AuthFacade } from '@beauty-platform-validated/storefront-data-access';

// ── Fixtures ────────────────────────────────────────────────────────────────

const stubUser = {
  id: 'u1',
  email: 'alice@example.com',
  firstName: 'Alice',
  lastName: 'Jones',
  roles: ['CUSTOMER'],
  permissions: [],
};

function makeAuthFacade(user: typeof stubUser | null) {
  return {
    user: vi.fn().mockReturnValue(user),
    logout: vi.fn(),
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('AccountProfileComponent', () => {
  it('displays the logged-in user name and email', async () => {
    await TestBed.configureTestingModule({
      imports: [AccountProfileComponent],
      providers: [
        provideRouter([]),
        { provide: AuthFacade, useValue: makeAuthFacade(stubUser) },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AccountProfileComponent);
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Alice Jones');
    expect(text).toContain('alice@example.com');
  });

  it('renders links to Order history and Wishlist', async () => {
    await TestBed.configureTestingModule({
      imports: [AccountProfileComponent],
      providers: [
        provideRouter([]),
        { provide: AuthFacade, useValue: makeAuthFacade(stubUser) },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AccountProfileComponent);
    fixture.detectChanges();

    const anchors: HTMLAnchorElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('a'),
    );
    expect(anchors.some((a) => a.getAttribute('href') === '/orders')).toBe(true);
    expect(anchors.some((a) => a.getAttribute('href') === '/wishlist')).toBe(true);
  });

  it('calls authFacade.logout when the Sign out button is clicked', async () => {
    const auth = makeAuthFacade(stubUser);
    await TestBed.configureTestingModule({
      imports: [AccountProfileComponent],
      providers: [
        provideRouter([]),
        { provide: AuthFacade, useValue: auth },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AccountProfileComponent);
    fixture.detectChanges();

    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    );
    const signOut = buttons.find((b) => b.textContent?.includes('Sign out'));
    expect(signOut).toBeDefined();
    signOut!.click();

    expect(auth.logout).toHaveBeenCalledOnce();
  });

  it('shows a sign-in prompt when no user is authenticated', async () => {
    await TestBed.configureTestingModule({
      imports: [AccountProfileComponent],
      providers: [
        provideRouter([]),
        { provide: AuthFacade, useValue: makeAuthFacade(null) },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(AccountProfileComponent);
    fixture.detectChanges();

    const text: string = fixture.nativeElement.textContent;
    expect(text).toContain('Sign in');
    // No name or email should be visible
    expect(text).not.toContain('Alice');
  });
});
