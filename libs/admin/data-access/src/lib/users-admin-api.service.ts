import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BeautyPlatformAPIService, CreateManagedUserDto, UserResponseDto } from '@beauty-platform-validated/api-client';

@Injectable({ providedIn: 'root' })
export class UsersAdminApiService {
  private readonly generated = inject(BeautyPlatformAPIService);
  /**
   * Used directly for the Day 1 endpoints not yet in the generated client.
   * The apiUrlInterceptor in the admin app rewrites bare relative paths to the
   * real API origin, so GET /admin/customers/:id → http://…/api/admin/customers/:id.
   */
  private readonly http = inject(HttpClient);

  list() {
    return this.generated.usersControllerFindAll();
  }

  create(user: CreateManagedUserDto) {
    return this.generated.usersControllerCreate(user);
  }

  /**
   * Fetches a single customer by id from the Day 1 GET /admin/customers/:id
   * endpoint.
   *
   * TODO(orval-regen): replace with
   *   this.generated.adminCustomersControllerGetById(id)
   * once the spec is regenerated and the generated client updated.
   */
  getById(id: string) {
    return this.http.get<UserResponseDto>(`/admin/customers/${id}`);
  }
}
