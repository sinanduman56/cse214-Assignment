import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CartStateService {
  /** Reactive cart item count — updated by components when cart changes */
  count = signal<number>(0);

  set(n: number): void {
    this.count.set(n);
  }

  increment(): void {
    this.count.update(n => n + 1);
  }

  decrement(): void {
    this.count.update(n => Math.max(0, n - 1));
  }

  reset(): void {
    this.count.set(0);
  }
}
