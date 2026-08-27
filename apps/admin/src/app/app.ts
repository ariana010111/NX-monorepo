import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthFacade } from '@beauty-platform-validated/admin-data-access';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'admin';
  protected readonly authFacade = inject(AuthFacade);
  protected readonly navItems = [
    { label: 'Dashboard', link: '/orders', active: true },
    { label: 'Products', link: '/products' },
    { label: 'Categories', link: '/taxonomy' },
    { label: 'Orders', link: '/orders' },
    { label: 'Customers', link: '/users' },
    { label: 'Inventory', link: '/inventory' },
    { label: 'Settings', link: '/users' },
  ];
}
