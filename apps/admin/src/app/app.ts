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
    { label: 'Orders', link: '/orders' },
    { label: 'Products', link: '/products' },
    { label: 'Taxonomy', link: '/taxonomy' },
    { label: 'Inventory', link: '/inventory' },
    { label: 'Customers', link: '/users' },
    { label: 'Analytics', link: '/analytics' },
  ];
}
