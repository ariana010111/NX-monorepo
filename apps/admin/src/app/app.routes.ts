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
import {
  OrderListFacade,
  OrderListComponent,
  OrderDetailComponent,
} from '@beauty-platform-validated/admin-feature-orders-mgmt';
import {
  CustomerListComponent,
  UserAddComponent,
  CustomerDetailComponent,
  AnalyticsDashboardComponent,
} from '@beauty-platform-validated/admin-feature-customers-mgmt';
import { LoginComponent } from './login/login.component';
import { adminGuard } from './core/admin.guard';

export const appRoutes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    canActivate: [adminGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'orders' },
      { path: 'orders', component: OrderListComponent, providers: [OrderListFacade] },
      { path: 'orders/:id', component: OrderDetailComponent },
      { path: 'products', component: ProductListComponent, providers: [ProductListFacade] },
      { path: 'products/new', component: ProductFormComponent },
      { path: 'products/:id/edit', component: ProductFormComponent },
      { path: 'taxonomy', component: TaxonomyComponent, providers: [TaxonomyFacade] },
      { path: 'inventory', component: InventoryComponent, providers: [InventoryFacade] },
      { path: 'analytics', component: AnalyticsDashboardComponent },
      { path: 'users', component: CustomerListComponent },
      // 'users/add' MUST be declared before 'users/:id' — Angular matches
      // children top-down, so the literal "add" would otherwise be captured
      // as a :id param value and render CustomerDetailComponent for /users/add.
      { path: 'users/add', component: UserAddComponent },
      { path: 'users/:id', component: CustomerDetailComponent },
    ],
  },
];
