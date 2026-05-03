import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly API = 'http://localhost:8080/api/analytics';

  constructor(private http: HttpClient) {}

  getAdminDashboard(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.API}/admin/dashboard`);
  }

  getStoreDashboard(storeId: number): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.API}/store/${storeId}/dashboard`);
  }

  getStoreCustomers(storeId: number): Observable<{ byCity: Record<string, number>; byMembership: Record<string, number> }> {
    return this.http.get<{ byCity: Record<string, number>; byMembership: Record<string, number> }>(`${this.API}/store/${storeId}/customers`);
  }

  getRevenueDrillDown(storeId: number, from?: string, to?: string): Observable<{ byProduct: Record<string, number>; daily: Record<string, number> }> {
    let params = '';
    if (from) params += `?from=${from}`;
    if (to) params += `${params ? '&' : '?'}to=${to}`;
    return this.http.get<{ byProduct: Record<string, number>; daily: Record<string, number> }>(`${this.API}/store/${storeId}/revenue${params}`);
  }

  getCrossStoreComparison(): Observable<{ storeId: number; storeName: string; totalOrders: number; totalRevenue: number; totalProducts: number }[]> {
    return this.http.get<any[]>(`${this.API}/admin/stores/comparison`);
  }

  getUserSpending(userId: number): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.API}/user/${userId}/spending`);
  }
}
