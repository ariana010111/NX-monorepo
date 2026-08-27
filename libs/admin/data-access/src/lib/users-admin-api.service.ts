import { Injectable, inject } from '@angular/core';
import { BeautyPlatformAPIService } from '@beauty-platform-validated/api-client';
import { CreateManagedUserDto } from '@beauty-platform-validated/api-client';

@Injectable({ providedIn: 'root' })
export class UsersAdminApiService {
  private readonly generated = inject(BeautyPlatformAPIService);

  list() {
    return this.generated.usersControllerFindAll();
  }

  create(user: CreateManagedUserDto) {
    return this.generated.usersControllerCreate(user);
  }
}
