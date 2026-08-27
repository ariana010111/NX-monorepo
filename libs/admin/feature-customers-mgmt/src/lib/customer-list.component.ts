import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { UsersAdminApiService } from '@beauty-platform-validated/admin-data-access';

@Component({
  selector: 'beauty-admin-customer-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="admin-panel">
      <div class="beauty-section-head">
        <h2>Users</h2>
        <a class="beauty-btn beauty-btn--primary" routerLink="/users/add">Add User</a>
      </div>

      @if (customersResource.isLoading()) {
        <p>Loading...</p>
      } @else {
        <div class="admin-table-wrap">
          <table class="beauty-table">
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
        </div>
      }
    </section>
  `,
})
export class CustomerListComponent {
  private readonly usersApi = inject(UsersAdminApiService);
  readonly customersResource = rxResource({ stream: () => this.usersApi.list() });
}
