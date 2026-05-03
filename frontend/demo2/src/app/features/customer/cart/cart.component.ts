import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { Cart, CartItem } from '../../../core/models/cart.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDividerModule,
    MatSelectModule, MatFormFieldModule, FormsModule,
  ],
  templateUrl: './cart.component.html',
})
export class CartComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  cart: Cart | null = null;
  loading = true;
  checkingOut = false;
  paymentMethod = 'CREDIT_CARD';
  paymentMethods = [
    { value: 'CREDIT_CARD', label: 'Kredi Kartı' },
    { value: 'DEBIT_CARD', label: 'Banka Kartı' },
    { value: 'BANK_TRANSFER', label: 'Havale/EFT' },
    { value: 'CASH_ON_DELIVERY', label: 'Kapıda Ödeme' },
  ];

  constructor(private cartService: CartService, public auth: AuthService, private snack: MatSnackBar) {}

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    const userId = this.auth.userId()!;
    this.cartService.getCart(userId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (cart) => { this.cart = cart; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }

  updateQuantity(item: CartItem, qty: number): void {
    if (qty < 1) { this.removeItem(item); return; }
    const userId = this.auth.userId()!;
    this.cartService.updateItem(userId, item.id, qty).subscribe((cart) => (this.cart = cart));
  }

  removeItem(item: CartItem): void {
    const userId = this.auth.userId()!;
    this.cartService.removeItem(userId, item.id).subscribe((cart) => (this.cart = cart));
  }

  clearCart(): void {
    const userId = this.auth.userId()!;
    this.cartService.clearCart(userId).subscribe((cart) => (this.cart = cart));
  }

  checkout(): void {
    this.checkingOut = true;
    const userId = this.auth.userId()!;
    this.cartService.checkout(userId, this.paymentMethod).subscribe({
      next: (order) => {
        this.checkingOut = false;
        this.snack.open(`Sipariş #${order.id} oluşturuldu!`, 'Tamam', { duration: 4000 });
        this.loadCart();
      },
      error: (err) => {
        this.checkingOut = false;
        this.snack.open(err?.error?.message ?? 'Ödeme başarısız', 'Kapat', { duration: 4000 });
      },
    });
  }

  get total(): number {
    return this.cart?.items?.reduce((sum, i) => sum + i.product.unitPrice * i.quantity, 0) ?? 0;
  }

  getImageUrl(item: CartItem): string {
    return item.product.imageUrl || 'https://placehold.co/80x80/eceff1/90a4ae?text=Ürün';
  }
}
