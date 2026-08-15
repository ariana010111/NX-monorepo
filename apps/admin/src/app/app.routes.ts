import { Routes } from '@angular/router';
import {
  ProductListFacade,
  ProductListComponent,
  ProductFormComponent,
  TaxonomyFacade,
  TaxonomyComponent,
  InventoryFacade,
  InventoryComponent,
} from '@beauty-platform-validated/admin-feature-catalog-mgmt';

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'products' },
  { path: 'products', component: ProductListComponent, providers: [ProductListFacade] },
  { path: 'products/new', component: ProductFormComponent },
  { path: 'products/:id/edit', component: ProductFormComponent },
  { path: 'taxonomy', component: TaxonomyComponent, providers: [TaxonomyFacade] },
  { path: 'inventory', component: InventoryComponent, providers: [InventoryFacade] },
];
