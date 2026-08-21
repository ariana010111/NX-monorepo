import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { UsersAdminApiService } from '@beauty-platform-validated/admin-data-access';

// Minimal, unstyled markup — functional wiring only, per direct
// instruction that UI/CSS is being handled separately.
@Component({
  selector: 'beauty-admin-customer-list',
  standalone: true,
  template: `
    <h1>Customers</h1>
    @if (customersResource.isLoading()) {
      <p>Loading…</p>
    } @else {
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Roles</th></tr></thead>
        <tbody>
          @for (user of customersResource.value(); track user.id) {
            <tr>
              <td>{{ user.firstName }} {{ user.lastName }}</td>
              <td>{{ user.email }}</td>
              <td>{{ user.roles.join(', ') }}</td>
            </tr>
          }
        </tbody>
      </table>
    }
  `,
})
export class CustomerListComponent {
  private readonly usersApi = inject(UsersAdminApiService);
  readonly customersResource = rxResource({ stream: () => this.usersApi.list() });
}
