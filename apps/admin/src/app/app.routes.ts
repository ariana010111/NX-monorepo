import { Routes } from '@angular/router';
import { ProductListFacade, ProductListComponent, ProductFormComponent } from '@beauty-platform-validated/admin-feature-catalog-mgmt';

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'products' },
  { path: 'products', component: ProductListComponent, providers: [ProductListFacade] },
  { path: 'products/new', component: ProductFormComponent },
  { path: 'products/:id/edit', component: ProductFormComponent },
];
