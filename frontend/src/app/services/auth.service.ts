import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { environment } from '../../environments/environment.prod';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // ✅ Using environment variable for API URL
  private API_URL = environment.apiUrl;
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
  
  constructor(private http: HttpClient) {
    console.log('AuthService initialized with API_URL:', this.API_URL); // Helpful for debugging
    this.checkAuthStatus();
    // Check auth status every 5 minutes (reduced from 1 minute to save API calls)
    interval(300000).subscribe(() => this.checkAuthStatus());
  }

  // Login redirects to Deriv OAuth page
  login(): void {
    window.location.href = `${this.API_URL}/api/auth/login`;
  }

  checkAuthStatus(): void {
    this.http.get<{ authenticated: boolean }>(`${this.API_URL}/api/auth/user`, { withCredentials: true })
      .subscribe({
        next: (response) => this.isAuthenticatedSubject.next(response.authenticated),
        error: () => this.isAuthenticatedSubject.next(false)
      });
  }

  logout(): Observable<any> {
    return this.http.post(`${this.API_URL}/api/auth/logout`, {}, { withCredentials: true });
  }

  getUserInfo(): Observable<any> {
    return this.http.get(`${this.API_URL}/api/auth/user`, { withCredentials: true });
  }
}