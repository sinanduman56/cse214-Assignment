import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./users/user-management.component').then((m) => m.UserManagementComponent),
      },
      {
        path: 'stores',
        loadComponent: () =>
          import('./stores/store-management.component').then((m) => m.StoreManagementComponent),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./categories/category-management.component').then((m) => m.CategoryManagementComponent),
      },
      {
        path: 'audit-logs',
        loadComponent: () =>
          import('./audit-logs/audit-logs.component').then((m) => m.AuditLogsComponent),
      },
      {
        path: 'chat',
        loadComponent: () =>
          import('../chat/chat.component').then((m) => m.ChatComponent),
      },
    ],
  },
];
