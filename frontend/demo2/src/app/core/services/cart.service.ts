import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cart } from '../models/cart.model';
import { Order } from '../models/order.model';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly API = 'http://localhost:8080/api/cart';

  constructor(private http: HttpClient) {}

  getCart(userId: number): Observable<Cart> {
    return this.http.get<Cart>(`${this.API}/${userId}`);
  }

  addItem(userId: number, productId: number, quantity = 1): Observable<Cart> {
    return this.http.post<Cart>(`${this.API}/${userId}/items`, null, {
      params: { productId: productId.toString(), quantity: quantity.toString() },
    });
  }

  updateItem(userId: number, itemId: number, quantity: number): Observable<Cart> {
    return this.http.put<Cart>(`${this.API}/${userId}/items/${itemId}`, null, {
      params: { quantity: quantity.toString() },
    });
  }

  removeItem(userId: number, itemId: number): Observable<Cart> {
    return this.http.delete<Cart>(`${this.API}/${userId}/items/${itemId}`);
  }

  clearCart(userId: number): Observable<Cart> {
    return this.http.delete<Cart>(`${this.API}/${userId}/clear`);
  }

  checkout(userId: number, paymentMethod: string): Observable<Order> {
    return this.http.post<Order>(`${this.API}/${userId}/checkout`, { paymentMethod });
  }
}
