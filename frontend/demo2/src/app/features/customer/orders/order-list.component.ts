import { Component, OnInit, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { Order } from '../../../core/models/order.model';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatFormFieldModule, MatSelectModule, FormsModule,
  ],
  templateUrl: './order-list.component.html',
})
export class OrderListComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  orders: Order[] = [];
  filtered: Order[] = [];
  loading = true;
  statusFilter = 'ALL';
  statuses = ['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  constructor(private orderService: OrderService, private auth: AuthService) {}

  ngOnInit(): void {
    this.orderService.getByUser(this.auth.userId()!).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (orders) => { this.orders = orders; this.applyFilter(); this.loading = false; },
      error: () => (this.loading = false),
    });
  }

  applyFilter(): void {
    this.filtered = this.statusFilter === 'ALL'
      ? this.orders
      : this.orders.filter((o) => o.status === this.statusFilter);
  }

  statusClass(status: string): string {
    return status?.toLowerCase() ?? '';
  }

  exportCsv(): void {
    const rows = [['ID', 'Tarih', 'Tutar', 'Durum', 'Ödeme'], ...this.filtered.map((o) => [o.id, o.orderDate, o.grandTotal, o.status, o.paymentMethod ?? ''])];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'siparislerim.csv'; a.click();
    URL.revokeObjectURL(url);
  }
}
