import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductsAdminApiService } from './products-admin-api.service';

describe('ProductsAdminApiService', () => {
  let service: ProductsAdminApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(ProductsAdminApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
