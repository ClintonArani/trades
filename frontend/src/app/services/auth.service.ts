import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private API_URL = environment.apiUrl;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  private accessTokenSubject = new BehaviorSubject<string | null>(null);
  public accessToken$ = this.accessTokenSubject.asObservable(); // ✅ Make this public

  constructor(private http: HttpClient) {
    console.log('AuthService initialized with API_URL:', this.API_URL);
    this.checkAuthStatus();
    interval(300000).subscribe(() => this.checkAuthStatus());
  }

  login(): void {
    window.location.href = `${this.API_URL}/api/auth/login`;
  }

  checkAuthStatus(): void {
    console.log('Checking auth status...');
    this.http
      .get<{ authenticated: boolean; token?: string }>(`${this.API_URL}/api/auth/user`, {
        withCredentials: true,
      })
      .subscribe({
        next: (response) => {
          console.log('Auth check response:', response);
          this.isAuthenticatedSubject.next(response.authenticated);
          if (response.authenticated && response.token) {
            this.accessTokenSubject.next(response.token);
          }
        },
        error: (error) => {
          console.error('Auth check error:', error);
          this.isAuthenticatedSubject.next(false);
          this.accessTokenSubject.next(null);
        },
      });
  }

  getAccessToken(): Observable<string | null> {
    return this.accessToken$; // ✅ Return the observable directly
  }

  logout(): Observable<any> {
    return this.http.post(`${this.API_URL}/api/auth/logout`, {}, { withCredentials: true });
  }

  getUserInfo(): Observable<any> {
    return this.http.get(`${this.API_URL}/api/auth/user`, { withCredentials: true });
  }
}
