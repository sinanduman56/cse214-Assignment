import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly API = 'http://localhost:8080/api/orders';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Order[]> {
    return this.http.get<Order[]>(this.API);
  }

  getById(id: number): Observable<Order> {
    return this.http.get<Order>(`${this.API}/${id}`);
  }

  getByUser(userId: number): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.API}/user/${userId}`);
  }

  getByStore(storeId: number): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.API}/store/${storeId}`);
  }

  create(order: Partial<Order>): Observable<Order> {
    return this.http.post<Order>(this.API, order);
  }

  update(id: number, order: Partial<Order>): Observable<Order> {
    return this.http.put<Order>(`${this.API}/${id}`, order);
  }

  updateStatus(id: number, status: string): Observable<Order> {
    return this.http.patch<Order>(`${this.API}/${id}/status`, { status });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}
