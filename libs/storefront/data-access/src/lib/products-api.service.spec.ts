import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ProductsApiService } from './products-api.service';

describe('ProductsApiService', () => {
  let service: ProductsApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HttpClientTestingModule] });
    service = TestBed.inject(ProductsApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
