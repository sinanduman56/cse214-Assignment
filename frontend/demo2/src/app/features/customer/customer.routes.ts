import { Routes } from '@angular/router';
import { CustomerLayoutComponent } from './layout/customer-layout.component';

export const CUSTOMER_ROUTES: Routes = [
  {
    path: '',
    component: CustomerLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/customer-dashboard.component').then((m) => m.CustomerDashboardComponent),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./products/product-list.component').then((m) => m.ProductListComponent),
      },
      {
        path: 'products/:id',
        loadComponent: () =>
          import('./products/product-detail.component').then((m) => m.ProductDetailComponent),
      },
      {
        path: 'stores',
        loadComponent: () =>
          import('./stores/store-list.component').then((m) => m.StoreListComponent),
      },
      {
        path: 'stores/:id',
        loadComponent: () =>
          import('./stores/store-detail.component').then((m) => m.StoreDetailComponent),
      },
      {
        path: 'cart',
        loadComponent: () =>
          import('./cart/cart.component').then((m) => m.CartComponent),
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('./checkout/checkout.component').then((m) => m.CheckoutComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./orders/order-list.component').then((m) => m.OrderListComponent),
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import('./orders/order-detail.component').then((m) => m.OrderDetailComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./profile/profile.component').then((m) => m.ProfileComponent),
      },
      {
        path: 'chat',
        loadComponent: () =>
          import('../chat/chat.component').then((m) => m.ChatComponent),
      },
      {
        path: 'wishlist',
        loadComponent: () =>
          import('./wishlist/wishlist.component').then((m) => m.WishlistComponent),
      },
    ],
  },
];
