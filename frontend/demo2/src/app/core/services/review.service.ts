import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Review, ReviewStats } from '../models/review.model';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly API = 'http://localhost:8080/api/reviews';

  constructor(private http: HttpClient) {}

  getByProduct(productId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.API}/product/${productId}`);
  }

  getByStore(storeId: number): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.API}/store/${storeId}`);
  }

  getStatsByProduct(productId: number): Observable<ReviewStats> {
    return this.http.get<ReviewStats>(`${this.API}/product/${productId}/stats`);
  }

  /** Kullanıcının bu ürünü satın alıp almadığını sorgular */
  canReview(userId: number, productId: number): Observable<boolean> {
    return this.http
      .get<{ canReview: boolean }>(`${this.API}/can-review/${productId}?userId=${userId}`)
      .pipe(map(r => r.canReview));
  }

  create(request: { userId: number; productId: number; starRating: number; content: string }): Observable<Review> {
    return this.http.post<Review>(this.API, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }

  getAll(): Observable<Review[]> {
    return this.http.get<Review[]>(this.API);
  }

  getMostReviewed(limit = 10): Observable<{ productId: number; reviewCount: number }[]> {
    return this.http.get<any[]>(`${this.API}/analytics/most-reviewed?limit=${limit}`);
  }

  getWorstRated(limit = 10, minReviews = 3): Observable<{ productId: number; averageRating: number }[]> {
    return this.http.get<any[]>(`${this.API}/analytics/worst-rated?limit=${limit}&minReviews=${minReviews}`);
  }

  getBestRated(limit = 10, minReviews = 3): Observable<{ productId: number; averageRating: number }[]> {
    return this.http.get<any[]>(`${this.API}/analytics/best-rated?limit=${limit}&minReviews=${minReviews}`);
  }
}

