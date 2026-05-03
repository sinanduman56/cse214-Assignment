import { Component, OnInit, Input, DestroyRef, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { CartStateService } from '../../../core/services/cart-state.service';
import { ReviewService } from '../../../core/services/review.service';
import { AuthService } from '../../../core/services/auth.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { Product } from '../../../core/models/product.model';
import { Review, ReviewStats } from '../../../core/models/review.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss',
})
export class ProductDetailComponent implements OnInit {
  private productService = inject(ProductService);
  private cartService    = inject(CartService);
  private cartState      = inject(CartStateService);
  private reviewService  = inject(ReviewService);
  public  auth           = inject(AuthService);
  public  wishlist       = inject(WishlistService);
  private snack          = inject(MatSnackBar);
  private destroyRef     = inject(DestroyRef);

  @Input() id!: string;

  product  = signal<Product | null>(null);
  reviews  = signal<Review[]>([]);
  stats    = signal<ReviewStats | null>(null);
  loading  = signal(true);
  submitting = signal(false);
  quantity = signal(1);
  canReview = signal(false);   // Kullanıcı bu ürünü satın aldı mı?

  // Review form state
  hoverStar    = signal(0);
  selectedStar = signal(0);
  reviewText   = signal('');

  avgRating = computed(() => this.stats()?.averageRating ?? 0);
  reviewCount = computed(() => this.stats()?.reviewCount ?? 0);

  readonly stars5 = [5, 4, 3, 2, 1] as const;
  readonly starsAsc = [1, 2, 3, 4, 5] as const;

  ngOnInit(): void {
    const productId = Number(this.id);
    this.productService.getById(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(p => { this.product.set(p); this.loading.set(false); });

    this.loadReviews(productId);

    // Kullanıcı giriş yaptıysa satın alma durumunu kontrol et
    const userId = this.auth.userId();
    if (userId) {
      this.reviewService.canReview(userId, productId)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(ok => this.canReview.set(ok));
    }
  }

  private loadReviews(productId: number): void {
    this.reviewService.getByProduct(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(r => this.reviews.set(r));

    this.reviewService.getStatsByProduct(productId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(s => this.stats.set(s));
  }

  // ── Cart ────────────────────────────────────────────────────────────────
  addToCart(): void {
    const userId = this.auth.userId();
    const product = this.product();
    if (!userId || !product) return;
    this.cartService.addItem(userId, product.id, this.quantity()).subscribe(() => {
      this.cartState.increment();
      this.snack.open('Sepete eklendi!', 'Tamam', { duration: 2500, panelClass: 'snack-success' });
    });
  }

  // ── Review form ─────────────────────────────────────────────────────────
  setStar(star: number): void { this.selectedStar.set(star); }
  setHover(star: number): void { this.hoverStar.set(star); }
  clearHover(): void { this.hoverStar.set(0); }

  activeStar(star: number): boolean {
    const h = this.hoverStar();
    return h > 0 ? star <= h : star <= this.selectedStar();
  }

  submitReview(): void {
    const userId = this.auth.userId();
    const product = this.product();
    if (!userId) { this.snack.open('Yorum yazmak için giriş yapın', 'Kapat', { duration: 3000 }); return; }
    if (!this.selectedStar()) { this.snack.open('Lütfen bir puan seçin', 'Kapat', { duration: 2500 }); return; }
    if (!product) return;

    this.submitting.set(true);
    this.reviewService.create({
      userId,
      productId: product.id,
      starRating: this.selectedStar(),
      content: this.reviewText(),
    }).pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: r => {
          this.reviews.update(list => [r, ...list]);
          this.reviewService.getStatsByProduct(product.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(s => this.stats.set(s));
          this.selectedStar.set(0);
          this.reviewText.set('');
          this.submitting.set(false);
          this.snack.open('Yorumunuz eklendi!', 'Tamam', { duration: 2500, panelClass: 'snack-success' });
        },
        error: () => {
          this.submitting.set(false);
          this.snack.open('Yorum eklenemedi', 'Kapat', { duration: 3000 });
        }
      });
  }

  // ── Helpers ─────────────────────────────────────────────────────────────
  decrementQty(): void { if (this.quantity() > 1) this.quantity.update(n => n - 1); }
  incrementQty(): void { this.quantity.update(n => n + 1); }

  getImageUrl(): string {
    return this.product()?.imageUrl || 'https://placehold.co/600x400/eceff1/90a4ae?text=Ürün';
  }

  distPct(star: number): number {
    const dist = this.stats()?.distribution;
    const total = this.reviewCount();
    if (!dist || !total) return 0;
    return Math.round(((dist[star] ?? 0) / total) * 100);
  }

  /** Returns array of star objects for a rating 1-5 to render filled/half/empty */
  renderStars(rating: number): { type: 'full' | 'half' | 'empty' }[] {
    return [1, 2, 3, 4, 5].map(i => ({
      type: i <= Math.floor(rating) ? 'full' :
            (i - 0.5 <= rating ? 'half' : 'empty')
    }));
  }

  timeAgo(dateStr?: string): string {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins} dakika önce`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} saat önce`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days} gün önce`;
    return new Date(dateStr).toLocaleDateString('tr-TR');
  }
}

