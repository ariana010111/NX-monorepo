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
import { OrderListFacade, OrderListComponent } from '@beauty-platform-validated/admin-feature-orders-mgmt';

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'orders' },
  { path: 'orders', component: OrderListComponent, providers: [OrderListFacade] },
  { path: 'products', component: ProductListComponent, providers: [ProductListFacade] },
  { path: 'products/new', component: ProductFormComponent },
  { path: 'products/:id/edit', component: ProductFormComponent },
  { path: 'taxonomy', component: TaxonomyComponent, providers: [TaxonomyFacade] },
  { path: 'inventory', component: InventoryComponent, providers: [InventoryFacade] },
];
