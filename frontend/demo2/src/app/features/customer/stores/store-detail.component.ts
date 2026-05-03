import {
  Component, OnInit, AfterViewInit, OnDestroy,
  inject, signal, DestroyRef, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, EMPTY } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, tap } from 'rxjs/operators';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { StoreService } from '../../../core/services/store.service';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { CartService } from '../../../core/services/cart.service';
import { CartStateService } from '../../../core/services/cart-state.service';
import { WishlistService } from '../../../core/services/wishlist.service';
import { AuthService } from '../../../core/services/auth.service';
import { Store } from '../../../core/models/store.model';
import { Product, ProductPage } from '../../../core/models/product.model';
import { Category } from '../../../core/models/category.model';

@Component({
  selector: 'app-store-detail',
  standalone: true,
  imports: [
    CommonModule, RouterLink, ReactiveFormsModule,
    MatIconModule, MatProgressSpinnerModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatSnackBarModule,
  ],
  templateUrl: './store-detail.component.html',
})
export class StoreDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private storeService = inject(StoreService);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private cartService = inject(CartService);
  private cartState = inject(CartStateService);
  private snack = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);
  private fb = inject(FormBuilder);
  public auth = inject(AuthService);
  wishlist = inject(WishlistService);

  @ViewChild('sentinel', { static: false }) sentinelEl!: ElementRef;
  private observer: IntersectionObserver | null = null;

  store = signal<Store | null>(null);
  products = signal<Product[]>([]);
  categories = signal<Category[]>([]);
  totalElements = signal(0);
  currentPage = signal(0);
  totalPages = signal(0);
  loading = signal(true);
  storeLoading = signal(true);
  loadingMore = signal(false);
  selectedCategoryId = signal<number | null>(null);

  readonly pageSize = 24;
  private storeId = 0;
  private filterChange$ = new Subject<void>();

  readonly sortOptions = [
    { value: 'name_asc', label: 'İsim A→Z' },
    { value: 'name_desc', label: 'İsim Z→A' },
    { value: 'unitPrice_asc', label: 'Fiyat: Düşük→Yüksek' },
    { value: 'unitPrice_desc', label: 'Fiyat: Yüksek→Düşük' },
  ];

  filterForm = this.fb.group({
    keyword: [''],
    sort: ['name_asc'],
  });

  ngOnInit(): void {
    this.storeId = Number(this.route.snapshot.paramMap.get('id'));

    this.storeService.getById(this.storeId).subscribe(s => {
      this.store.set(s);
      this.storeLoading.set(false);
    });

    this.categoryService.getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(c => this.categories.set(c));

    this.filterForm.valueChanges.pipe(
      debounceTime(400),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => this.resetAndLoad());

    this.filterChange$.pipe(
      tap(() => {
        if (this.currentPage() === 0) this.loading.set(true);
        else this.loadingMore.set(true);
      }),
      switchMap(() => {
        const v = this.filterForm.value;
        const [sortBy, sortDir] = (v.sort || 'name_asc').split('_');
        return this.productService.search({
          keyword: v.keyword || undefined,
          categoryId: this.selectedCategoryId() || undefined,
          storeId: this.storeId,
          sortBy,
          sortDir,
          page: this.currentPage(),
          size: this.pageSize,
        }).pipe(catchError(() => {
          this.loading.set(false);
          this.loadingMore.set(false);
          return EMPTY;
        }));
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe((page: ProductPage) => {
      if (this.currentPage() === 0) {
        this.products.set(page.content);
      } else {
        this.products.update(prev => [...prev, ...page.content]);
      }
      this.totalElements.set(page.totalElements);
      this.totalPages.set(page.totalPages);
      this.loading.set(false);
      this.loadingMore.set(false);
    });

    this.filterChange$.next();
  }

  ngAfterViewInit(): void {
    this.observer = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) this.loadNextPage(); },
      { rootMargin: '300px' }
    );
    this.observer.observe(this.sentinelEl.nativeElement);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }

  private resetAndLoad(): void {
    this.currentPage.set(0);
    this.filterChange$.next();
  }

  loadNextPage(): void {
    if (this.loadingMore() || this.loading()) return;
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(p => p + 1);
      this.filterChange$.next();
    }
  }

  selectCategory(id: number | null): void {
    this.selectedCategoryId.set(id);
    this.resetAndLoad();
  }

  hasMore(): boolean {
    return this.currentPage() < this.totalPages() - 1;
  }

  addToCart(product: Product, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    const userId = this.auth.userId();
    if (!userId) {
      this.snack.open('Sepete eklemek için giriş yapın', 'Kapat', { duration: 3000 });
      return;
    }
    this.cartService.addItem(userId, product.id).subscribe(() => {
      this.cartState.increment();
      this.snack.open(`${product.name} sepete eklendi ✓`, 'Tamam', { duration: 2000, panelClass: 'snack-success' });
    });
  }

  toggleWishlist(product: Product, event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.wishlist.toggle(product);
    const msg = this.wishlist.has(product.id) ? 'Favorilere eklendi ♥' : 'Favorilerden kaldırıldı';
    this.snack.open(msg, '', { duration: 1800 });
  }

  getImageUrl(product: Product): string {
    return product.imageUrl || 'https://placehold.co/400x300/eceff1/90a4ae?text=Urun';
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.onerror = null;
    img.src = 'https://placehold.co/400x300/eceff1/90a4ae?text=Urun';
  }

  getCategoryIcon(name: string): string {
    const icons: Record<string, string> = {
      'Elektronik': 'devices',
      'Kadin Giyim': 'checkroom',
      'Erkek Giyim': 'dry_cleaning',
      'Ev ve Yasam': 'chair',
      'Spor ve Outdoor': 'sports_soccer',
      'Kitap ve Kirtasiye': 'menu_book',
      'Kozmetik ve Bakim': 'spa',
      'Gida ve Icecek': 'restaurant',
    };
    return icons[name] || 'category';
  }
}
