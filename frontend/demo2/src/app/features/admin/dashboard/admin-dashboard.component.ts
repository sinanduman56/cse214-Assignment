import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Chart, registerables } from 'chart.js';
import { AdminService } from '../../../core/services/admin.service';
import { AnalyticsService } from '../../../core/services/analytics.service';

Chart.register(...registerables);

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('platformChart') platformChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('storeRevenueChart') storeRevenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('storeOrderChart') storeOrderChartRef!: ElementRef<HTMLCanvasElement>;

  summary: Record<string, unknown> = {};
  analytics: Record<string, unknown> = {};
  storeComparison: { storeId: number; storeName: string; totalOrders: number; totalRevenue: number; totalProducts: number }[] = [];
  loading = true;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private chart?: Chart<any, any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private storeRevenueChart?: Chart<any, any, any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private storeOrderChart?: Chart<any, any, any>;
  private destroyRef = inject(DestroyRef);

  constructor(private adminService: AdminService, private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.adminService.getPlatformSummary().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((s) => {
      this.summary = s;
    });
    this.analyticsService.getAdminDashboard().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((a) => {
      this.analytics = a;
      this.loading = false;
      setTimeout(() => this.buildChart(), 150);
    });
    this.analyticsService.getCrossStoreComparison().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      this.storeComparison = data;
      setTimeout(() => { this.buildStoreRevenueChart(); this.buildStoreOrderChart(); }, 150);
    });
  }

  ngAfterViewInit(): void {}

  buildChart(): void {
    if (!this.platformChartRef) return;
    const ctx = this.platformChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.chart) this.chart.destroy();
    // @ts-ignore
    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Kullanıcılar', 'Siparişler', 'Ürünler', 'Mağazalar', 'Yorumlar'],
        datasets: [{
          label: 'Platform Özeti',
          data: [
            Number(this.analytics['totalUsers'] ?? 0),
            Number(this.analytics['totalOrders'] ?? 0),
            Number(this.analytics['totalProducts'] ?? 0),
            Number(this.analytics['totalStores'] ?? 0),
            Number(this.analytics['totalReviews'] ?? 0),
          ],
          backgroundColor: ['#3f51b5','#00897b','#f57c00','#8e24aa','#e53935'],
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

  buildStoreRevenueChart(): void {
    if (!this.storeRevenueChartRef || !this.storeComparison.length) return;
    const ctx = this.storeRevenueChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.storeRevenueChart) this.storeRevenueChart.destroy();
    const colors = ['#3f51b5','#00897b','#f57c00','#e53935','#8e24aa','#0288d1','#558b2f','#6d4c41'];
    // @ts-ignore
    this.storeRevenueChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.storeComparison.map(s => s.storeName),
        datasets: [{
          label: 'Toplam Gelir (₺)',
          data: this.storeComparison.map(s => Number(s.totalRevenue)),
          backgroundColor: this.storeComparison.map((_, i) => colors[i % colors.length]),
          borderRadius: 6,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  buildStoreOrderChart(): void {
    if (!this.storeOrderChartRef || !this.storeComparison.length) return;
    const ctx = this.storeOrderChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    if (this.storeOrderChart) this.storeOrderChart.destroy();
    // @ts-ignore
    this.storeOrderChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.storeComparison.map(s => s.storeName),
        datasets: [{
          data: this.storeComparison.map(s => Number(s.totalOrders)),
          backgroundColor: ['#3f51b5','#00897b','#f57c00','#e53935','#8e24aa','#0288d1','#558b2f','#6d4c41'],
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'right' } },
      },
    });
  }
}
