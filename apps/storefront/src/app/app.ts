import { Component, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  CartFacade,
  AuthFacade,
  PageViewService,
} from '@beauty-platform-validated/storefront-data-access';

@Component({
  imports: [RouterModule, CurrencyPipe],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly cart = inject(CartFacade);
  protected readonly authFacade = inject(AuthFacade);
  protected readonly isCartOpen = signal(false);
  protected readonly isAccountMenuOpen = signal(false);
  protected readonly cartDisplayItems = computed(() => this.cart.items().slice(0, 3));
  protected readonly customerName = computed(() => this.authFacade.user()?.firstName || 'Account');

  protected readonly navItems = [
    { label: 'Shop', link: '/' },
    { label: 'New In', link: '/' },
    { label: 'Best Sellers', link: '/' },
    { label: 'Brands', link: '/' },
  ];

  protected readonly categories = ['Skincare', 'Makeup', 'Haircare', 'Fragrance', 'Body Care', 'Tools'];

  /**
   * Injecting PageViewService here triggers its instantiation at app startup
   * (root-provided services are lazy until first injected).  init() starts the
   * NavigationEnd subscription; the isPlatformBrowser guard inside init() makes
   * it a no-op during SSR, so prerendering is unaffected.
   */
  constructor() {
    inject(PageViewService).init();
  }

  protected toggleCart() {
    this.isCartOpen.update((value) => !value);
    if (this.isCartOpen()) {
      this.isAccountMenuOpen.set(false);
    }
  }

  protected closeCart() {
    this.isCartOpen.set(false);
  }

  protected toggleAccountMenu() {
    this.isAccountMenuOpen.update((value) => !value);
    if (this.isAccountMenuOpen()) {
      this.isCartOpen.set(false);
    }
  }

  protected closeAccountMenu() {
    this.isAccountMenuOpen.set(false);
  }

  protected onSignOut() {
    this.closeAccountMenu();
    this.authFacade.logout();
  }
}
