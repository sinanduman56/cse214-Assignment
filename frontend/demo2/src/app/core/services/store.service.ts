import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Store } from '../models/store.model';

@Injectable({ providedIn: 'root' })
export class StoreService {
  private readonly API = 'http://localhost:8080/api/stores';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Store[]> {
    return this.http.get<Store[]>(this.API);
  }

  getById(id: number): Observable<Store> {
    return this.http.get<Store>(`${this.API}/${id}`);
  }

  getByOwner(ownerId: number): Observable<Store[]> {
    return this.http.get<Store[]>(`${this.API}/owner/${ownerId}`);
  }

  create(store: Partial<Store>): Observable<Store> {
    return this.http.post<Store>(this.API, store);
  }

  update(id: number, store: Partial<Store>): Observable<Store> {
    return this.http.put<Store>(`${this.API}/${id}`, store);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/${id}`);
  }
}
