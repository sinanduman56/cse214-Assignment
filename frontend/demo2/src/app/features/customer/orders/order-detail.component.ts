import { Component, OnInit, Input, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models/order.model';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule, MatDividerModule],
  templateUrl: './order-detail.component.html',
})
export class OrderDetailComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  @Input() id!: string;
  order: Order | null = null;
  loading = true;

  constructor(private orderService: OrderService) {}

  ngOnInit(): void {
    this.orderService.getById(Number(this.id)).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (o) => { this.order = o; this.loading = false; },
      error: () => (this.loading = false),
    });
  }

  statusClass(status: string): string {
    return status?.toLowerCase() ?? '';
  }

  get subtotal(): number {
    return this.order?.orderItems?.reduce((s, i) => s + i.unitPrice * i.quantity, 0) ?? 0;
  }
}
