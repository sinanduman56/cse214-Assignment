import { Category } from './category.model';
import { Store } from './store.model';
import { Review } from './review.model';

export interface Product {
  id: number;
  sku: string;
  name: string;
  unitPrice: number;
  imageUrl?: string;
  description?: string;
  stockQuantity?: number;
  category?: Category;
  store?: Store;
  reviews?: Review[];
}

export interface ProductPage {
  content: Product[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ProductSearchParams {
  keyword?: string;
  categoryId?: number;
  storeId?: number;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}
