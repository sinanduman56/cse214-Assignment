import { Component, OnInit, DestroyRef, inject, signal, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/services/auth.service';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { OrderService } from '../../../core/services/order.service';
import { Order } from '../../../core/models/order.model';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './customer-dashboard.component.html',
  styleUrl: './customer-dashboard.component.scss',
})
export class CustomerDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  private destroyRef = inject(DestroyRef);
  private auth = inject(AuthService);
  private analyticsService = inject(AnalyticsService);
  private orderService = inject(OrderService);

  @ViewChild('spendingChart') chartRef!: ElementRef<HTMLCanvasElement>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private chart?: Chart<any, any, any>;

  analytics = signal<Record<string, unknown>>({});
  recentOrders = signal<Order[]>([]);
  loading = signal(true);
  allOrders: Order[] = [];

  ngOnInit(): void {
    const userId = this.auth.userId()!;
    this.analyticsService.getUserSpending(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => this.analytics.set(data));

    this.orderService.getByUser(userId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((orders) => {
        this.allOrders = orders;
        this.recentOrders.set(orders.slice(0, 5));
        this.loading.set(false);
        setTimeout(() => this.buildChart(), 100);
      });
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  buildChart(): void {
    if (!this.chartRef?.nativeElement) return;
    this.chart?.destroy();

    // Group orders by month (last 7 months)
    const now = new Date();
    const months: string[] = [];
    const totals: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' }));
      const t = this.allOrders
        .filter(o => {
          const od = new Date(o.orderDate);
          return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth();
        })
        .reduce((sum, o) => sum + (o.grandTotal ?? 0), 0);
      totals.push(t);
    }

    // @ts-ignore
    this.chart = new Chart(this.chartRef.nativeElement, {
      type: 'line',
      data: {
        labels: months,
        datasets: [{
          label: 'Harcama (₺)',
          data: totals,
          fill: true,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.08)',
          pointBackgroundColor: '#6366f1',
          pointRadius: 5,
          pointHoverRadius: 7,
          tension: 0.4,
          borderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${(ctx.parsed.y ?? 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`
            }
          }
        },
        scales: {
          x: {
            grid: { color: '#f1f5f9' },
            ticks: { color: '#94a3b8', font: { size: 12 } }
          },
          y: {
            grid: { color: '#f1f5f9' },
            ticks: {
              color: '#94a3b8', font: { size: 12 },
              callback: (v) => `₺${Number(v).toLocaleString('tr-TR')}`
            }
          }
        }
      }
    });
  }

  get totalOrders(): number  { return +(this.analytics()['totalOrders'] ?? 0); }
  get totalSpent(): number   { return +(this.analytics()['totalSpent']  ?? 0); }
  get totalReviews(): number { return +(this.analytics()['totalReviews'] ?? 0); }
  get activeOrders(): number {
    return this.allOrders.filter(o => o.status === 'SHIPPED' || o.status === 'CONFIRMED').length;
  }

  countByStatus(status: string): number {
    return this.allOrders.filter(o => o.status === status).length;
  }

  statusClass(status: string): string { return status?.toLowerCase() ?? ''; }
  statusLabel(status: string): string {
    const map: Record<string,string> = {
      PENDING:'Bekliyor', CONFIRMED:'Onaylandı', SHIPPED:'Kargoda',
      DELIVERED:'Teslim Edildi', CANCELLED:'İptal'
    };
    return map[status] ?? status;
  }
}
