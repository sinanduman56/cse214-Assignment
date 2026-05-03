import { Routes } from '@angular/router';
import { CorporateLayoutComponent } from './layout/corporate-layout.component';

export const CORPORATE_ROUTES: Routes = [
  {
    path: '',
    component: CorporateLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/store-dashboard.component').then((m) => m.StoreDashboardComponent),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./products/product-management.component').then((m) => m.ProductManagementComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./orders/order-management.component').then((m) => m.OrderManagementComponent),
      },
      {
        path: 'reviews',
        loadComponent: () =>
          import('./reviews/review-management.component').then((m) => m.ReviewManagementComponent),
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./analytics/store-analytics.component').then((m) => m.StoreAnalyticsComponent),
      },
      {
        path: 'chat',
        loadComponent: () =>
          import('../chat/chat.component').then((m) => m.ChatComponent),
      },
    ],
  },
];
