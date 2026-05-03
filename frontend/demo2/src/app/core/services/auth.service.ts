import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AuthResponse, LoginRequest, RegisterRequest, CurrentUser } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly API = 'http://localhost:8080/api/auth';
  private readonly STORAGE_KEY = 'currentUser';

  private _currentUser = signal<CurrentUser | null>(this.loadFromStorage());

  readonly currentUser = this._currentUser.asReadonly();
  readonly isLoggedIn = computed(() => !!this._currentUser());
  readonly userRole = computed(() => this._currentUser()?.roleType ?? null);
  readonly userId = computed(() => this._currentUser()?.userId ?? null);

  constructor(private http: HttpClient, private router: Router) {}

  login(request: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/login`, request).pipe(
      tap((res) => this.setUser(res))
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API}/register`, request).pipe(
      tap((res) => this.setUser(res))
    );
  }

  logout(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this._currentUser.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return this._currentUser()?.token ?? null;
  }

  private setUser(res: AuthResponse): void {
    const user: CurrentUser = {
      userId: res.userId,
      email: res.email,
      roleType: res.roleType,
      token: res.token,
      refreshToken: res.refreshToken,
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    this._currentUser.set(user);
  }

  private loadFromStorage(): CurrentUser | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? (JSON.parse(data) as CurrentUser) : null;
    } catch {
      return null;
    }
  }
}
