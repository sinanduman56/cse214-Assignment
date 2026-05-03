import { Injectable, signal } from '@angular/core';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly KEY = 'shopplatform_wishlist';

  items = signal<Product[]>(this.load());

  private load(): Product[] {
    try {
      return JSON.parse(localStorage.getItem(this.KEY) ?? '[]');
    } catch {
      return [];
    }
  }

  private save(list: Product[]): void {
    localStorage.setItem(this.KEY, JSON.stringify(list));
  }

  toggle(product: Product): void {
    this.items.update(list => {
      const exists = list.some(p => p.id === product.id);
      const next = exists
        ? list.filter(p => p.id !== product.id)
        : [...list, product];
      this.save(next);
      return next;
    });
  }

  has(productId: number): boolean {
    return this.items().some(p => p.id === productId);
  }

  get count(): number {
    return this.items().length;
  }

  clear(): void {
    this.items.set([]);
    localStorage.removeItem(this.KEY);
  }
}
