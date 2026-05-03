import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { WishlistService } from '../../../core/services/wishlist.service';
import { CartService } from '../../../core/services/cart.service';
import { CartStateService } from '../../../core/services/cart-state.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatSnackBarModule],
  template: `
    <div class="wl-page">
      <div class="wl-header">
        <div class="wl-title-row">
          <div class="wl-icon-box"><mat-icon>favorite</mat-icon></div>
          <div>
            <h1>Favorilerim</h1>
            <p>{{ wishlist.items().length }} ürün kaydedildi</p>
          </div>
        </div>
        @if (wishlist.items().length > 0) {
          <button class="clear-btn" (click)="clearAll()">
            <mat-icon>delete_sweep</mat-icon> Tümünü Temizle
          </button>
        }
      </div>

      @if (wishlist.items().length === 0) {
        <div class="empty-state">
          <div class="empty-icon"><mat-icon>favorite_border</mat-icon></div>
          <h3>Henüz favori ürün yok</h3>
          <p>Beğendiğin ürünleri favorilere ekle, kaybet!</p>
          <a routerLink="/customer/products" class="browse-btn">
            <mat-icon>store</mat-icon> Ürünleri Keşfet
          </a>
        </div>
      } @else {
        <div class="wl-grid">
          @for (product of wishlist.items(); track product.id) {
            <div class="wl-card">
              <div class="wl-card-img">
                <img [src]="product.imageUrl || 'https://placehold.co/300x220/f1f5f9/94a3b8?text=Urun'"
                     [alt]="product.name" />
                <button class="remove-btn" (click)="wishlist.toggle(product)" title="Favoriden kaldır">
                  <mat-icon>favorite</mat-icon>
                </button>
              </div>
              <div class="wl-card-body">
                <div class="wl-sku">{{ product.sku }}</div>
                <h3 class="wl-name">{{ product.name }}</h3>
                <div class="wl-footer">
                  <span class="wl-price">{{ product.unitPrice | number:'1.2-2' }} ₺</span>
                  <button class="cart-btn" (click)="addToCart(product)">
                    <mat-icon>add_shopping_cart</mat-icon>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .wl-page { padding: 0; }

    .wl-header {
      display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px;
    }
    .wl-title-row { display: flex; align-items: center; gap: 14px; }
    .wl-icon-box {
      width: 44px; height: 44px; border-radius: 12px;
      background: rgba(236,72,153,0.12); display: flex; align-items: center; justify-content: center;
      mat-icon { color: #ec4899; font-size: 1.4rem; width: 1.4rem; height: 1.4rem; }
    }
    h1 { font-size: 1.3rem; font-weight: 800; color: var(--c-text, #1e293b); }
    p { font-size: 0.8rem; color: var(--c-muted, #94a3b8); margin-top: 2px; }

    .clear-btn {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 14px; border-radius: 10px;
      border: 1.5px solid #fca5a5; background: rgba(239,68,68,0.06);
      color: #ef4444; font-size: 0.8rem; font-weight: 600; cursor: pointer;
      transition: background 0.15s;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
      &:hover { background: rgba(239,68,68,0.12); }
    }

    .empty-state {
      display: flex; flex-direction: column; align-items: center;
      padding: 80px 20px; text-align: center;
    }
    .empty-icon {
      width: 80px; height: 80px; border-radius: 50%;
      background: rgba(236,72,153,0.08); display: flex; align-items: center; justify-content: center;
      margin-bottom: 20px;
      mat-icon { font-size: 2.2rem; width: 2.2rem; height: 2.2rem; color: #ec4899; }
    }
    .empty-state h3 { font-size: 1.15rem; font-weight: 700; color: var(--c-text, #1e293b); }
    .empty-state p { color: var(--c-muted, #94a3b8); margin: 8px 0 20px; font-size: 0.875rem; }
    .browse-btn {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 24px; border-radius: 10px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: #fff; font-weight: 600; font-size: 0.875rem;
      text-decoration: none; transition: opacity 0.15s;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
      &:hover { opacity: 0.88; }
    }

    .wl-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px;
    }
    .wl-card {
      background: var(--c-card, #fff);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 1px 4px rgba(0,0,0,0.07);
      transition: transform 0.2s, box-shadow 0.2s;
      &:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
    }
    .wl-card-img {
      position: relative; aspect-ratio: 4/3; overflow: hidden;
      img { width: 100%; height: 100%; object-fit: cover; }
    }
    .remove-btn {
      position: absolute; top: 8px; right: 8px;
      width: 32px; height: 32px; border-radius: 8px;
      background: rgba(236,72,153,0.9); border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; color: #fff; }
      &:hover { background: #ec4899; }
    }
    .wl-card-body { padding: 14px 16px; }
    .wl-sku { font-size: 0.7rem; color: var(--c-muted, #94a3b8); margin-bottom: 4px; }
    .wl-name {
      font-size: 0.92rem; font-weight: 600; color: var(--c-text, #1e293b);
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 12px;
    }
    .wl-footer { display: flex; align-items: center; justify-content: space-between; }
    .wl-price { font-size: 1.05rem; font-weight: 800; color: #6366f1; }
    .cart-btn {
      width: 34px; height: 34px; border-radius: 9px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; color: #fff; }
      &:hover { opacity: 0.85; }
    }
  `],
})
export class WishlistComponent {
  wishlist = inject(WishlistService);
  private cartSvc = inject(CartService);
  private cartState = inject(CartStateService);
  private auth = inject(AuthService);
  private snack = inject(MatSnackBar);

  addToCart(product: any): void {
    const userId = this.auth.userId();
    if (!userId) return;
    this.cartSvc.addItem(userId, product.id, 1).subscribe({
      next: () => {
        this.cartState.increment();
        this.snack.open(`${product.name} sepete eklendi`, '✓', { duration: 2000, panelClass: 'snack-success' });
      },
      error: () => this.snack.open('Sepete eklenemedi', 'Kapat', { duration: 2500 }),
    });
  }

  clearAll(): void {
    this.wishlist.clear();
  }
}
