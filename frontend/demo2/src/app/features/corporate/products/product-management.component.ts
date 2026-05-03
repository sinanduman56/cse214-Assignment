import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { ProductService } from '../../../core/services/product.service';
import { CategoryService } from '../../../core/services/category.service';
import { StoreService } from '../../../core/services/store.service';
import { AuthService } from '../../../core/services/auth.service';
import { Product } from '../../../core/models/product.model';
import { Category } from '../../../core/models/category.model';
import { Store } from '../../../core/models/store.model';

@Component({
  selector: 'app-product-management',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, FormsModule,
    MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule,
    MatTableModule, MatDialogModule, MatProgressSpinnerModule,
    MatSnackBarModule, MatSelectModule,
  ],
  templateUrl: './product-management.component.html',
})
export class ProductManagementComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);
  private categoryService = inject(CategoryService);
  private storeService = inject(StoreService);
  public auth = inject(AuthService);
  private snack = inject(MatSnackBar);
  private destroyRef = inject(DestroyRef);

  products: Product[] = [];
  categories: Category[] = [];
  store: Store | null = null;
  loading = true;
  showForm = false;
  editingId: number | null = null;
  displayedColumns = ['sku', 'name', 'price', 'stock', 'category', 'actions'];

  form = this.fb.nonNullable.group({
    sku: ['', Validators.required],
    name: ['', Validators.required],
    unitPrice: [0, [Validators.required, Validators.min(0.01)]],
    stockQuantity: [0, [Validators.required, Validators.min(0)]],
    categoryId: [null as number | null],
  });

  get lowStockProducts(): Product[] {
    return this.products.filter(p => (p.stockQuantity ?? 0) < 10);
  }

  constructor() {}

  ngOnInit(): void {
    this.categoryService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((c) => (this.categories = c));
    this.storeService.getByOwner(this.auth.userId()!).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((stores) => {
      if (stores.length > 0) {
        this.store = stores[0];
        this.loadProducts();
      } else {
        this.loading = false;
      }
    });
  }

  loadProducts(): void {
    if (!this.store) return;
    this.productService.getByStore(this.store.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (p) => { this.products = p; this.loading = false; },
      error: () => (this.loading = false),
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.form.reset({ sku: '', name: '', unitPrice: 0, stockQuantity: 0, categoryId: null });
    this.showForm = true;
  }

  editProduct(p: Product): void {
    this.editingId = p.id;
    this.form.patchValue({ sku: p.sku, name: p.name, unitPrice: p.unitPrice, stockQuantity: p.stockQuantity ?? 0, categoryId: p.category?.id ?? null });
    this.showForm = true;
  }

  save(): void {
    if (this.form.invalid || !this.store) return;
    const { sku, name, unitPrice, stockQuantity, categoryId } = this.form.getRawValue();
    const payload: Record<string, unknown> = {
      sku, name, unitPrice, stockQuantity,
      store: { id: this.store.id },
    };
    if (categoryId) payload['category'] = { id: categoryId };

    const req = this.editingId
      ? this.productService.update(this.editingId, payload)
      : this.productService.create(payload);

    req.subscribe({
      next: () => {
        this.snack.open(this.editingId ? 'Ürün güncellendi' : 'Ürün eklendi', 'Tamam', { duration: 2500 });
        this.showForm = false;
        this.loadProducts();
      },
      error: (err) => this.snack.open(err?.error?.message ?? 'Hata', 'Kapat', { duration: 3000 }),
    });
  }

  deleteProduct(id: number): void {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    this.productService.delete(id).subscribe(() => {
      this.snack.open('Ürün silindi', 'Tamam', { duration: 2500 });
      this.loadProducts();
    });
  }

  cancelForm(): void {
    this.showForm = false;
  }
}
