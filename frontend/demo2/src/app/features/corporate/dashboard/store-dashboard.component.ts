import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { StoreService } from '../../../core/services/store.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { Store } from '../../../core/models/store.model';
import { Order } from '../../../core/models/order.model';

Chart.register(...registerables);

@Component({
  selector: 'app-store-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './store-dashboard.component.html',
})
export class StoreDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('revenueChart') revenueChartRef!: ElementRef<HTMLCanvasElement>;

  store: Store | null = null;
  analytics: Record<string, unknown> = {};
  recentOrders: Order[] = [];
  loading = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private chart?: Chart<any, any, any>;
  private destroyRef = inject(DestroyRef);

  constructor(
    private storeService: StoreService,
    private analyticsService: AnalyticsService,
    private orderService: OrderService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    const userId = this.auth.userId()!;
    this.storeService.getByOwner(userId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((stores) => {
      if (stores.length > 0) {
        this.store = stores[0];
        this.analyticsService.getStoreDashboard(this.store.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
          this.analytics = data;
          this.loading = false;
          setTimeout(() => this.buildChart(), 100);
        });
        // Mağazaya ait son 5 siparişi getir
        this.orderService.getByStore(this.store.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((orders) => {
          this.recentOrders = orders.slice(0, 5);
        });
      } else {
        this.loading = false;
      }
    });
  }

  ngAfterViewInit(): void {}

  buildChart(): void {
    if (!this.revenueChartRef) return;
    const ctx = this.revenueChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.chart) this.chart.destroy();
    // @ts-ignore
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Toplam Ürün', 'Toplam Sipariş'],
        datasets: [{
          label: 'Özet',
          data: [Number(this.analytics['totalProducts'] ?? 0), Number(this.analytics['totalOrders'] ?? 0)],
          backgroundColor: ['#3f51b5', '#00897b'],
          borderRadius: 8,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  statusClass(status: string): string {
    return status?.toLowerCase() ?? '';
  }
}
