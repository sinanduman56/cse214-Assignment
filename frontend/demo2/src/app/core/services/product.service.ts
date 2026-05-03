import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, ProductPage, ProductSearchParams } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly API = 'http://localhost:8080/api/products';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Product[]> {
    return this.http.get<Product[]>(this.API);
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.API}/${id}`);
  }

  search(params: ProductSearchParams): Observable<ProductPage> {
    let httpParams = new HttpParams();
    if (params.keyword) httpParams = httpParams.set('keyword', params.keyword);
    if (params.categoryId) httpParams = httpParams.set('categoryId', params.categoryId.toString());
    if (params.storeId) httpParams = httpParams.set('storeId', params.storeId.toString());
    if (params.minPrice !== undefined) httpParams = httpParams.set('minPrice', params.minPrice.toString());
    if (params.maxPrice !== undefined) httpParams = httpParams.set('maxPrice', params.maxPrice.toString());
    if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
    if (params.sortDir) httpParams = httpParams.set('sortDir', params.sortDir);
    return this.http.get<ProductPage>(`${this.API}/search`, { params: httpParams });
  }

  getByStore(storeId: number): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.API}/store/${storeId}`);
  }

  create(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(this.API, product);
  }

  update(id: number, product: Partial<Product>): Observable<Product> {
    return this.http.put<Product>(`${this.API}/${id}`, product);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }

  uploadImage(id: number, file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<string>(`${this.API}/${id}/upload-image`, formData);
  }
}
