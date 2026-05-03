import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { CartStateService } from '../../../core/services/cart-state.service';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  styles: [`
    :host { display: flex; height: 100vh; overflow: hidden; font-family: 'Inter', 'Roboto', sans-serif; }

    .sidebar {
      width: 240px; min-width: 240px;
      background: #0d0d1a; color: #e2e8f0;
      display: flex; flex-direction: column;
      overflow-y: auto; overflow-x: hidden;
      scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent;
    }
    .sidebar-brand {
      display: flex; align-items: center; gap: 12px;
      padding: 22px 20px; border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .brand-icon {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
    }
    .brand-text { font-size: 1.05rem; font-weight: 700; color: #fff; }
    .brand-sub  { font-size: 0.65rem; color: rgba(255,255,255,0.4); letter-spacing: 0.05em; text-transform: uppercase; }

    .nav-section {
      padding: 20px 20px 6px; font-size: 0.62rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.12em; color: rgba(255,255,255,0.3);
    }
    .nav-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; color: rgba(255,255,255,0.6);
      text-decoration: none; font-size: 0.875rem; font-weight: 500;
      border-radius: 10px; margin: 2px 10px;
      cursor: pointer; transition: all 0.18s ease;
    }
    .nav-item:hover { background: rgba(255,255,255,0.07); color: #fff; }
    .nav-item.active { background: rgba(99,102,241,0.2); color: #a5b4fc; }
    .nav-item.active .nav-icon-wrap { background: rgba(99,102,241,0.4) !important; }
    .nav-icon-wrap {
      width: 32px; height: 32px; border-radius: 8px;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .nav-icon-wrap mat-icon { font-size: 1.05rem; width: 1.05rem; height: 1.05rem; }
    .nav-badge {
      margin-left: auto; background: #6366f1; color: #fff;
      font-size: 0.6rem; font-weight: 700;
      padding: 2px 7px; border-radius: 20px;
      text-transform: uppercase; min-width: 20px; text-align: center;
    }
    .nav-spacer { flex: 1; }
    .nav-divider { border: none; border-top: 1px solid rgba(255,255,255,0.06); margin: 8px 12px; }
    .nav-logout { color: #f87171 !important; }
    .nav-logout:hover { background: rgba(248,113,113,0.1) !important; }

    .main {
      flex: 1; display: flex; flex-direction: column; overflow: hidden;
      background: var(--c-bg); transition: background 0.25s;
    }
    .topbar {
      background: var(--c-topbar); border-bottom: 1px solid var(--c-border);
      padding: 0 28px; height: 64px;
      display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;
      box-shadow: 0 1px 3px var(--c-shadow); transition: background 0.25s, border-color 0.25s;
    }
    .topbar-left  { display: flex; align-items: center; gap: 12px; }
    .topbar-greeting { font-size: 1rem; font-weight: 700; color: var(--c-text); }
    .topbar-sub { font-size: 0.78rem; color: var(--c-muted); margin-top: 1px; }
    .topbar-right { display: flex; align-items: center; gap: 10px; }
    .topbar-search {
      display: flex; align-items: center; gap: 8px;
      background: var(--c-input); border-radius: 10px;
      padding: 7px 14px; font-size: 0.85rem; color: var(--c-muted); cursor: pointer;
    }
    .topbar-avatar {
      width: 36px; height: 36px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: #fff; font-size: 0.85rem; font-weight: 700; cursor: pointer;
    }
    .icon-btn {
      width: 36px; height: 36px; border-radius: 10px;
      border: 1.5px solid var(--c-border); background: var(--c-input);
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      color: var(--c-muted); transition: all 0.18s; position: relative;
      mat-icon { font-size: 1.1rem; width: 1.1rem; height: 1.1rem; }
    }
    .icon-btn:hover { border-color: #6366f1; color: #6366f1; }
    .icon-btn.bell:hover { border-color: #f59e0b; color: #f59e0b; }
    .notif-dot {
      position: absolute; top: 4px; right: 4px;
      width: 8px; height: 8px; border-radius: 50%;
      background: #ef4444; border: 2px solid var(--c-topbar);
    }

    /* ─── Notification Dropdown ─── */
    .notif-panel-wrap { position: relative; }
    .notif-panel {
      position: absolute; top: calc(100% + 10px); right: 0;
      width: 340px;
      background: var(--c-card, #fff);
      border: 1px solid var(--c-border, #e2e8f0);
      border-radius: 16px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.15);
      z-index: 500;
      overflow: hidden;
    }
    .notif-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 18px 12px;
      border-bottom: 1px solid var(--c-border, #e2e8f0);
      font-size: 0.9rem; font-weight: 700; color: var(--c-text, #1e293b);
    }
    .notif-all-btn {
      font-size: 0.72rem; color: #6366f1; cursor: pointer;
      font-weight: 600; background: none; border: none; padding: 0;
    }
    .notif-item {
      display: flex; align-items: flex-start; gap: 12px;
      padding: 13px 18px;
      border-bottom: 1px solid var(--c-border, #f8fafc);
      cursor: pointer;
      &:last-child { border-bottom: none; }
      &:hover { background: var(--c-input, #f8fafc); }
      &.unread { background: rgba(99,102,241,0.04); }
    }
    .notif-icon-box {
      width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0;
      display: flex; align-items: center; justify-content: center;
      mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
    }
    .notif-title { font-size: 0.82rem; font-weight: 600; color: var(--c-text, #1e293b); }
    .notif-desc  { font-size: 0.75rem; color: var(--c-muted, #94a3b8); margin-top: 2px; }
    .notif-time  { font-size: 0.7rem; color: var(--c-muted, #94a3b8); margin-top: 4px; }
    .notif-empty {
      padding: 32px 18px; text-align: center;
      font-size: 0.85rem; color: var(--c-muted, #94a3b8);
    }
    .notif-backdrop {
      position: fixed; inset: 0; z-index: 499; background: transparent;
    }
    .content { flex: 1; overflow-y: auto; padding: 28px; background: var(--c-bg); transition: background 0.25s; }
  `],
  template: `
    <aside class="sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon">🛒</div>
        <div>
          <div class="brand-text">ShopPlatform</div>
          <div class="brand-sub">Bireysel Panel</div>
        </div>
      </div>

      <div class="nav-section">Ana Menü</div>

      <a routerLink="dashboard" routerLinkActive="active" class="nav-item">
        <div class="nav-icon-wrap" style="background:rgba(99,102,241,0.15)">
          <mat-icon style="color:#818cf8">dashboard</mat-icon>
        </div>
        Gösterge Paneli
      </a>

      <a routerLink="products" routerLinkActive="active" class="nav-item">
        <div class="nav-icon-wrap" style="background:rgba(34,197,94,0.15)">
          <mat-icon style="color:#4ade80">store</mat-icon>
        </div>
        Ürünler
        <span class="nav-badge" style="background:#059669">Yeni</span>
      </a>

      <a routerLink="wishlist" routerLinkActive="active" class="nav-item">
        <div class="nav-icon-wrap" style="background:rgba(236,72,153,0.15)">
          <mat-icon style="color:#ec4899">favorite</mat-icon>
        </div>
        Favorilerim
        @if (wishlist.count > 0) {
          <span class="nav-badge" style="background:#ec4899">{{ wishlist.count }}</span>
        }
      </a>

      <a routerLink="cart" routerLinkActive="active" class="nav-item">
        <div class="nav-icon-wrap" style="background:rgba(251,146,60,0.15)">
          <mat-icon style="color:#fb923c">shopping_cart</mat-icon>
        </div>
        Sepetim
        @if (cartState.count() > 0) {
          <span class="nav-badge" style="background:#ef4444">{{ cartState.count() }}</span>
        }
      </a>

      <a routerLink="orders" routerLinkActive="active" class="nav-item">
        <div class="nav-icon-wrap" style="background:rgba(56,189,248,0.15)">
          <mat-icon style="color:#38bdf8">receipt_long</mat-icon>
        </div>
        Siparişlerim
      </a>

      <div class="nav-section">Hesap</div>

      <a routerLink="profile" routerLinkActive="active" class="nav-item">
        <div class="nav-icon-wrap" style="background:rgba(168,85,247,0.15)">
          <mat-icon style="color:#c084fc">person</mat-icon>
        </div>
        Profilim
      </a>

      <a routerLink="chat" routerLinkActive="active" class="nav-item">
        <div class="nav-icon-wrap" style="background:rgba(251,191,36,0.15)">
          <mat-icon style="color:#fbbf24">smart_toy</mat-icon>
        </div>
        AI Asistan
        <span class="nav-badge" style="background:#f59e0b">AI</span>
      </a>

      <div class="nav-spacer"></div>
      <hr class="nav-divider">

      <div class="nav-item nav-logout" (click)="auth.logout()">
        <div class="nav-icon-wrap" style="background:rgba(248,113,113,0.15)">
          <mat-icon style="color:#f87171">logout</mat-icon>
        </div>
        Çıkış Yap
      </div>
    </aside>

    <div class="main">
      <header class="topbar">
        <div class="topbar-left">
          <div>
            <div class="topbar-greeting">Hoş geldin, {{ firstName() }} 👋</div>
            <div class="topbar-sub">{{ today }}</div>
          </div>
        </div>
        <div class="topbar-right">
          <div class="topbar-search">
            <mat-icon style="font-size:1rem;width:1rem;height:1rem">search</mat-icon>
            Ara...
            <span style="font-size:0.7rem;opacity:0.5;margin-left:6px">Ctrl+K</span>
          </div>

          <button class="icon-btn" (click)="theme.toggle()"
                  [title]="theme.isDark() ? 'Aydınlık Moda Geç' : 'Karanlık Moda Geç'">
            <mat-icon>{{ theme.isDark() ? 'light_mode' : 'dark_mode' }}</mat-icon>
          </button>

          <!-- Notification bell -->
          <div class="notif-panel-wrap">
            @if (notifOpen()) {
              <div class="notif-backdrop" (click)="notifOpen.set(false)"></div>
            }
            <button class="icon-btn bell" (click)="notifOpen.update(v => !v)" title="Bildirimler">
              <mat-icon>notifications</mat-icon>
              <div class="notif-dot"></div>
            </button>
            @if (notifOpen()) {
              <div class="notif-panel">
                <div class="notif-header">
                  <span>Bildirimler</span>
                  <button class="notif-all-btn" (click)="notifOpen.set(false)">Kapat</button>
                </div>
                @for (n of notifications; track n.id) {
                  <div class="notif-item" [class.unread]="n.unread">
                    <div class="notif-icon-box" [style.background]="n.bg">
                      <mat-icon [style.color]="n.color">{{ n.icon }}</mat-icon>
                    </div>
                    <div>
                      <div class="notif-title">{{ n.title }}</div>
                      <div class="notif-desc">{{ n.desc }}</div>
                      <div class="notif-time">{{ n.time }}</div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>

          <div class="topbar-avatar" [title]="auth.currentUser()?.email ?? ''">{{ initial() }}</div>
        </div>
      </header>
      <main class="content">
        <router-outlet />
      </main>
    </div>
  `,
})
export class CustomerLayoutComponent implements OnInit {
  auth       = inject(AuthService);
  theme      = inject(ThemeService);
  wishlist   = inject(WishlistService);
  cartState  = inject(CartStateService);
  private cartSvc = inject(CartService);

  notifOpen = signal(false);

  notifications = [
    {
      id: 1, unread: true, icon: 'local_shipping', color: '#38bdf8', bg: 'rgba(56,189,248,0.12)',
      title: 'Siparişiniz kargoya verildi',
      desc: '#SP-1042 numaralı siparişiniz yola çıktı.',
      time: '5 dakika önce'
    },
    {
      id: 2, unread: true, icon: 'local_offer', color: '#ec4899', bg: 'rgba(236,72,153,0.12)',
      title: 'Yeni kampanya başladı!',
      desc: 'Elektronik kategorisinde %20 indirim.',
      time: '1 saat önce'
    },
    {
      id: 3, unread: false, icon: 'check_circle', color: '#22c55e', bg: 'rgba(34,197,94,0.12)',
      title: 'Ödeme onaylandı',
      desc: '#SP-1039 siparişi ödemeniz alındı.',
      time: 'Dün'
    },
  ];

  today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  firstName = () => {
    const email = this.auth.currentUser()?.email ?? '';
    return email.split('@')[0] || 'Kullanıcı';
  };

  initial = () => {
    const email = this.auth.currentUser()?.email ?? 'K';
    return email[0].toUpperCase();
  };

  ngOnInit(): void {
    const userId = this.auth.userId();
    if (userId) {
      this.cartSvc.getCart(userId).subscribe({
        next: cart => {
          const total = cart?.items?.reduce((s, i) => s + (i.quantity ?? 1), 0) ?? 0;
          this.cartState.set(total);
        },
      });
    }
  }
}
