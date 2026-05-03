import { Component, OnInit, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CartService } from '../../../core/services/cart.service';
import { AuthService } from '../../../core/services/auth.service';
import { Cart } from '../../../core/models/cart.model';

// Luhn algorithm for card validation
function luhnCheck(cardNumber: string): boolean {
  const digits = cardNumber.replace(/\D/g, '');
  if (digits.length < 13) return false;
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = parseInt(digits[i], 10);
    if (alternate) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

function luhnValidator(control: AbstractControl): ValidationErrors | null {
  const val = (control.value ?? '').replace(/\s/g, '');
  if (!val) return null;
  return luhnCheck(val) ? null : { luhn: true };
}

function expiryValidator(control: AbstractControl): ValidationErrors | null {
  const val = control.value ?? '';
  const match = val.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return { expiry: true };
  const month = parseInt(match[1], 10);
  const year = parseInt('20' + match[2], 10);
  if (month < 1 || month > 12) return { expiry: true };
  const now = new Date();
  const expDate = new Date(year, month, 0);
  return expDate < now ? { expired: true } : null;
}

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.scss',
})
export class CheckoutComponent implements OnInit {
  private fb        = inject(FormBuilder);
  private cartSvc   = inject(CartService);
  private auth      = inject(AuthService);
  private router    = inject(Router);
  private snack     = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  cart        = signal<Cart | null>(null);
  loading     = signal(true);
  processing  = signal(false);
  success     = signal(false);
  activeTab   = signal<'card' | 'transfer' | 'cod'>('card');
  cardFlipped = signal(false);
  step        = signal<1 | 2 | 3>(1);   // 1=payment, 2=processing, 3=success

  cardForm = this.fb.group({
    cardNumber: ['', [Validators.required, luhnValidator]],
    cardHolder: ['', [Validators.required, Validators.minLength(3)]],
    expiry:     ['', [Validators.required, expiryValidator]],
    cvv:        ['', [Validators.required, Validators.pattern(/^\d{3,4}$/)]],
    saveCard:   [false],
  });

  get cardNumberRaw(): string {
    return (this.cardForm.get('cardNumber')?.value ?? '').replace(/\s/g, '');
  }
  get displayNumber(): string {
    const raw = this.cardNumberRaw;
    const padded = raw.padEnd(16, '•');
    return padded.match(/.{1,4}/g)?.join(' ') ?? '';
  }
  get displayHolder(): string {
    return this.cardForm.get('cardHolder')?.value?.toUpperCase() || 'AD SOYAD';
  }
  get displayExpiry(): string {
    return this.cardForm.get('expiry')?.value || 'AA/YY';
  }
  get cardType(): string {
    const n = this.cardNumberRaw;
    if (/^4/.test(n))             return 'visa';
    if (/^5[1-5]/.test(n))        return 'mastercard';
    if (/^3[47]/.test(n))         return 'amex';
    if (/^6(?:011|5)/.test(n))    return 'discover';
    if (/^9792/.test(n))          return 'troy';
    return 'generic';
  }

  get total(): number {
    return this.cart()?.items?.reduce((s, i) => s + i.product.unitPrice * i.quantity, 0) ?? 0;
  }
  get itemCount(): number {
    return this.cart()?.items?.length ?? 0;
  }

  ngOnInit(): void {
    const userId = this.auth.userId()!;
    this.cartSvc.getCart(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (c) => { this.cart.set(c); this.loading.set(false); },
        error: ()  => { this.loading.set(false); },
      });

    // Auto-format card number
    this.cardForm.get('cardNumber')!.valueChanges.subscribe(val => {
      if (val === null) return;
      const raw = val.replace(/\D/g, '').substring(0, 16);
      const formatted = raw.match(/.{1,4}/g)?.join(' ') ?? raw;
      if (formatted !== val) {
        this.cardForm.get('cardNumber')!.setValue(formatted, { emitEvent: false });
      }
    });

    // Auto-format expiry
    this.cardForm.get('expiry')!.valueChanges.subscribe(val => {
      if (val === null) return;
      const raw = val.replace(/\D/g, '').substring(0, 4);
      let formatted = raw;
      if (raw.length >= 3) formatted = raw.substring(0, 2) + '/' + raw.substring(2);
      if (formatted !== val) {
        this.cardForm.get('expiry')!.setValue(formatted, { emitEvent: false });
      }
    });
  }

  setTab(tab: 'card' | 'transfer' | 'cod'): void {
    this.activeTab.set(tab);
  }

  flipCard(flipped: boolean): void {
    this.cardFlipped.set(flipped);
  }

  getPaymentMethod(): string {
    const map = { card: 'CREDIT_CARD', transfer: 'BANK_TRANSFER', cod: 'CASH_ON_DELIVERY' } as const;
    return map[this.activeTab()];
  }

  canSubmit(): boolean {
    if (this.activeTab() === 'card') return this.cardForm.valid;
    return true;
  }

  placeOrder(): void {
    if (!this.canSubmit() || this.processing()) return;
    this.processing.set(true);
    this.step.set(2);

    const userId = this.auth.userId()!;
    // Simulate brief processing delay for UX
    setTimeout(() => {
      this.cartSvc.checkout(userId, this.getPaymentMethod())
        .subscribe({
          next: (order) => {
            this.processing.set(false);
            this.step.set(3);
            this.success.set(true);
            setTimeout(() => {
              this.router.navigate(['/customer/orders', order.id]);
            }, 2500);
          },
          error: (err) => {
            this.processing.set(false);
            this.step.set(1);
            this.snack.open(err?.error?.message ?? 'Ödeme sırasında hata oluştu', 'Kapat', { duration: 4000 });
          },
        });
    }, 1500);
  }
}
