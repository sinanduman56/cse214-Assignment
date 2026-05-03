import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { StoreService } from '../../../core/services/store.service';
import { ProductService } from '../../../core/services/product.service';
import { Store } from '../../../core/models/store.model';

interface StoreCard {
  store: Store;
  productCount: number;
}

@Component({
  selector: 'app-store-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './store-list.component.html',
})
export class StoreListComponent implements OnInit {
  private storeService = inject(StoreService);
  private productService = inject(ProductService);

  stores = signal<StoreCard[]>([]);
  loading = signal(true);

  readonly storeGradients = [
    'linear-gradient(135deg,#667eea,#764ba2)',
    'linear-gradient(135deg,#f093fb,#f5576c)',
    'linear-gradient(135deg,#4facfe,#00f2fe)',
    'linear-gradient(135deg,#43e97b,#38f9d7)',
    'linear-gradient(135deg,#fa709a,#fee140)',
  ];

  ngOnInit(): void {
    this.storeService.getAll().subscribe(stores => {
      const cards: StoreCard[] = stores.map(s => ({ store: s, productCount: 0 }));
      this.stores.set(cards);
      this.loading.set(false);
      // load product counts
      stores.forEach((s, i) => {
        this.productService.search({ storeId: s.id, size: 1, page: 0 }).subscribe(page => {
          this.stores.update(prev => {
            const copy = [...prev];
            copy[i] = { ...copy[i], productCount: page.totalElements };
            return copy;
          });
        });
      });
    });
  }

  getGradient(index: number): string {
    return this.storeGradients[index % this.storeGradients.length];
  }

  getInitials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }
}
