import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';
import { Store } from '../models/store.model';
import { AuditLog, AuditLogPage } from '../models/audit-log.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly API = 'http://localhost:8080/api/admin';

  constructor(private http: HttpClient) {}

  // Users
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.API}/users`);
  }

  suspendUser(id: number): Observable<User> {
    return this.http.put<User>(`${this.API}/users/${id}/suspend`, null);
  }

  activateUser(id: number): Observable<User> {
    return this.http.put<User>(`${this.API}/users/${id}/activate`, null);
  }

  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/users/${id}`);
  }

  // Stores
  getAllStores(): Observable<Store[]> {
    return this.http.get<Store[]>(`${this.API}/stores`);
  }

  openStore(id: number): Observable<Store> {
    return this.http.put<Store>(`${this.API}/stores/${id}/open`, null);
  }

  closeStore(id: number): Observable<Store> {
    return this.http.put<Store>(`${this.API}/stores/${id}/close`, null);
  }

  // Analytics
  getPlatformSummary(): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`${this.API}/analytics/summary`);
  }

  // Audit Logs
  getAuditLogs(page = 0, size = 20): Observable<AuditLogPage> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<AuditLogPage>(`${this.API}/audit-logs`, { params });
  }
}
