import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrderService } from '../../../core/services/order.service';
import { StoreService } from '../../../core/services/store.service';
import { AuthService } from '../../../core/services/auth.service';
import { Order } from '../../../core/models/order.model';

@Component({
  selector: 'app-order-management',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatButtonModule, MatIconModule,
    MatTableModule, MatProgressSpinnerModule, MatFormFieldModule,
    MatSelectModule, MatSnackBarModule,
  ],
  templateUrl: './order-management.component.html',
})
export class OrderManagementComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  orders: Order[] = [];
  filtered: Order[] = [];
  loading = true;
  statusFilter = 'ALL';
  statuses = ['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
  displayedColumns = ['id', 'date', 'total', 'payment', 'status', 'actions'];

  constructor(
    private orderService: OrderService,
    private storeService: StoreService,
    private auth: AuthService,
    private snack: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.storeService.getByOwner(this.auth.userId()!).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (stores) => {
        if (stores.length > 0) {
          this.orderService.getByStore(stores[0].id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (orders) => { this.orders = orders; this.applyFilter(); this.loading = false; },
            error: () => (this.loading = false),
          });
        } else {
          this.loading = false;
        }
      },
      error: () => (this.loading = false),
    });
  }

  applyFilter(): void {
    this.filtered = this.statusFilter === 'ALL'
      ? this.orders
      : this.orders.filter((o) => o.status === this.statusFilter);
  }

  updateStatus(order: Order, newStatus: string): void {
    this.orderService.updateStatus(order.id, newStatus).subscribe({
      next: (updated) => {
        order.status = updated.status;
        this.applyFilter();
        this.snack.open('Sipariş durumu güncellendi', 'Tamam', { duration: 2500 });
      },
      error: () => this.snack.open('Güncelleme başarısız', 'Kapat', { duration: 3000 }),
    });
  }

  statusClass(status: string): string {
    return status?.toLowerCase() ?? '';
  }
}
