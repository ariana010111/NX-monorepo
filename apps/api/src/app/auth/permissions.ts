import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

export const Permission = {
  ProductsRead: 'products:read',
  ProductsWrite: 'products:write',
  CategoriesRead: 'categories:read',
  CategoriesWrite: 'categories:write',
  BrandsRead: 'brands:read',
  BrandsWrite: 'brands:write',
  OrdersRead: 'orders:read',
  OrdersWrite: 'orders:write',
  UsersRead: 'users:read',
  UsersCreateStaff: 'users:create:staff',
  UsersCreateCustomer: 'users:create:customer',
  UsersCreateAdmin: 'users:create:admin',
  AnalyticsRead: 'analytics:read',
  RolesManage: 'roles:manage',
} as const;
