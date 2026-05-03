import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { StoreService } from '../../../core/services/store.service';
import { OrderService } from '../../../core/services/order.service';
import { AuthService } from '../../../core/services/auth.service';
import { Store } from '../../../core/models/store.model';
import { Order } from '../../../core/models/order.model';

Chart.register(...registerables);

@Component({
  selector: 'app-store-analytics',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatFormFieldModule, MatSelectModule, MatInputModule, FormsModule,
  ],
  templateUrl: './store-analytics.component.html',
})
export class StoreAnalyticsComponent implements OnInit, AfterViewInit {
  protected readonly Object = Object;

  @ViewChild('salesChart') salesChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart') statusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cityChart') cityChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('membershipChart') membershipChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('productChart') productChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('dailyChart') dailyChartRef!: ElementRef<HTMLCanvasElement>;

  store: Store | null = null;
  analytics: Record<string, unknown> = {};
  orders: Order[] = [];
  segmentation: { byCity: Record<string, number>; byMembership: Record<string, number> } | null = null;
  drillDown: { byProduct: Record<string, number>; daily: Record<string, number> } | null = null;
  filterFrom = '';
  filterTo = '';
  loading = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private salesChart?: Chart<any, any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private statusChart?: Chart<any, any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private cityChart?: Chart<any, any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private membershipChart?: Chart<any, any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private productChart?: Chart<any, any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private dailyChart?: Chart<any, any, any>;

  constructor(
    private analyticsService: AnalyticsService,
    private storeService: StoreService,
    private orderService: OrderService,
    private auth: AuthService
  ) {}

  ngOnInit(): void {
    this.storeService.getByOwner(this.auth.userId()!).subscribe((stores) => {
      if (stores.length > 0) {
        this.store = stores[0];
        this.analyticsService.getStoreDashboard(this.store.id).subscribe((d) => {
          this.analytics = d;
        });
        this.analyticsService.getStoreCustomers(this.store.id).subscribe((seg) => {
          this.segmentation = seg;
          setTimeout(() => { this.buildCityChart(); this.buildMembershipChart(); }, 150);
        });
        this.orderService.getByStore(this.store.id).subscribe((orders) => {
          this.orders = orders;
          this.loading = false;
          setTimeout(() => this.buildCharts(), 150);
        });
        this.loadDrillDown();
      } else {
        this.loading = false;
      }
    });
  }

  loadDrillDown(): void {
    if (!this.store) return;
    this.analyticsService.getRevenueDrillDown(this.store.id, this.filterFrom || undefined, this.filterTo || undefined)
      .subscribe((data) => {
        this.drillDown = data;
        setTimeout(() => { this.buildProductChart(); this.buildDailyChart(); }, 150);
      });
  }

  ngAfterViewInit(): void {}

  buildCharts(): void {
    this.buildSalesChart();
    this.buildStatusChart();
  }

  buildSalesChart(): void {
    if (!this.salesChartRef) return;
    const ctx = this.salesChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.salesChart) this.salesChart.destroy();

    // Group orders by month
    const monthly: Record<string, number> = {};
    this.orders.forEach((o) => {
      const month = new Date(o.orderDate).toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
      monthly[month] = (monthly[month] || 0) + o.grandTotal;
    });

    // @ts-ignore
    this.salesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Object.keys(monthly),
        datasets: [{
          label: 'Aylık Gelir (₺)',
          data: Object.values(monthly),
          borderColor: '#3f51b5',
          backgroundColor: 'rgba(63,81,181,0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#3f51b5',
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  buildStatusChart(): void {
    if (!this.statusChartRef) return;
    const ctx = this.statusChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.statusChart) this.statusChart.destroy();

    const statusMap: Record<string, number> = {};
    this.orders.forEach((o) => {
      statusMap[o.status] = (statusMap[o.status] || 0) + 1;
    });

    // @ts-ignore
    this.statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(statusMap),
        datasets: [{
          data: Object.values(statusMap),
          backgroundColor: ['#3f51b5','#00897b','#f57c00','#e53935','#8e24aa'],
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } },
      },
    });
  }

  buildCityChart(): void {
    if (!this.cityChartRef || !this.segmentation) return;
    const ctx = this.cityChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.cityChart) this.cityChart.destroy();

    // @ts-ignore
    this.cityChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(this.segmentation.byCity),
        datasets: [{
          label: 'Müşteri Sayısı',
          data: Object.values(this.segmentation.byCity),
          backgroundColor: 'rgba(0,137,123,0.7)',
          borderColor: '#00897b',
          borderWidth: 1,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
      },
    });
  }

  buildMembershipChart(): void {
    if (!this.membershipChartRef || !this.segmentation) return;
    const ctx = this.membershipChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.membershipChart) this.membershipChart.destroy();

    // @ts-ignore
    this.membershipChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: Object.keys(this.segmentation.byMembership),
        datasets: [{
          data: Object.values(this.segmentation.byMembership),
          backgroundColor: ['#1565c0','#c62828','#2e7d32','#f57f17','#6a1b9a'],
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } },
      },
    });
  }

  buildProductChart(): void {
    if (!this.productChartRef || !this.drillDown) return;
    const ctx = this.productChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.productChart) this.productChart.destroy();

    // @ts-ignore
    this.productChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(this.drillDown.byProduct),
        datasets: [{
          label: 'Gelir (₺)',
          data: Object.values(this.drillDown.byProduct),
          backgroundColor: 'rgba(63,81,181,0.75)',
          borderColor: '#3f51b5',
          borderWidth: 1,
          borderRadius: 6,
        }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true } },
      },
    });
  }

  buildDailyChart(): void {
    if (!this.dailyChartRef || !this.drillDown) return;
    const ctx = this.dailyChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.dailyChart) this.dailyChart.destroy();

    // @ts-ignore
    this.dailyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: Object.keys(this.drillDown.daily),
        datasets: [{
          label: 'Günlük Gelir (₺)',
          data: Object.values(this.drillDown.daily),
          borderColor: '#00897b',
          backgroundColor: 'rgba(0,137,123,0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 3,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }
}
