import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, finalize, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { jwtDecode } from 'jwt-decode';
import { Router } from '@angular/router';
import { ErrorService } from './error.service';
import { LoadingService } from './loading.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/api/auth`;
  private userRole: string | null = null;

  // This will hold the refresh token request to prevent multiple calls
  private refreshTokenRequest: Observable<any> | null = null;

  constructor(
    private http: HttpClient,
    private router: Router,
    private errorService: ErrorService,
    private loadingService: LoadingService
  ) {}

  login(credentials: any): Observable<any> {
    return this.loadingService.wrapWithLoading('login',
      this.http.post(`${this.apiUrl}/login`, credentials)
    ).pipe(
      tap(response => {
        this.storeTokens(response);
        this.errorService.showSuccess('Welcome!', 'You have successfully logged in.');
        this.redirectAfterLogin();
      })
    );
  }

  /**
   * Redirect user to appropriate page after login based on their role
   */
  private redirectAfterLogin(): void {
    const userRole = this.getRole();

    // Check if there's a return URL
    const returnUrl = localStorage.getItem('returnUrl');
    if (returnUrl) {
      localStorage.removeItem('returnUrl');
      this.router.navigate([returnUrl]);
      return;
    }

    // Default redirection based on role
    if (userRole === 'WORKER' || userRole === 'EMPLOYER') {
      this.router.navigate(['/app/dashboard']);
    } else {
      this.router.navigate(['/app']);
    }
  }

  /**
   * Store return URL for post-login redirection
   */
  setReturnUrl(url: string): void {
    localStorage.setItem('returnUrl', url);
  }

  register(userInfo: any): Observable<any> {
    return this.loadingService.wrapWithLoading('register',
      this.http.post(`${this.apiUrl}/register`, userInfo)
    ).pipe(
      tap((response) => {
        // Registration successful - notification will be shown on login page
        console.log('Registration successful:', response);
      })
    );
  }

  refreshToken(): Observable<any> {
    // If a refresh request is already in progress, return the existing one
    if (this.refreshTokenRequest) {
      return this.refreshTokenRequest;
    }

    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      // If no refresh token, logout and signal an error
      this.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    // Create the refresh token request
    this.refreshTokenRequest = this.http.post(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap((tokens: any) => {
        // When the new token is received, store it
        this.storeAccessToken(tokens.accessToken);
      }),
      finalize(() => {
        // When the request is complete (success or error), reset the request holder
        this.refreshTokenRequest = null;
      })
    );

    return this.refreshTokenRequest;
  }

  storeTokens(tokens: any): void {
    localStorage.setItem('access_token', tokens.accessToken);
    localStorage.setItem('refresh_token', tokens.refreshToken);
    this.decodeAndStoreRole(tokens.accessToken);
  }

  storeAccessToken(token: string): void {
    localStorage.setItem('access_token', token);
    this.decodeAndStoreRole(token);
  }

  private decodeAndStoreRole(token: string): void {
    try {
      const decodedToken: any = jwtDecode(token);
      this.userRole = decodedToken.role.replace('ROLE_', '');
    } catch(error) {
      console.error("Failed to decode token", error);
      this.userRole = null;
    }
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  getRole(): string | null {
    if (!this.userRole) {
      const token = localStorage.getItem('access_token');
      if (token) { this.decodeAndStoreRole(token); }
    }
    return this.userRole;
  }

  public isLoggedIn(): boolean {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return false;
    }

    // Check if token is expired
    try {
      const decodedToken: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (decodedToken.exp < currentTime) {
        // Token is expired, clean up
        this.logout();
        return false;
      }

      return true;
    } catch (error) {
      // Invalid token, clean up
      this.logout();
      return false;
    }
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: string): boolean {
    const userRole = this.getRole();
    return userRole === role;
  }

  /**
   * Check if user is a worker
   */
  isWorker(): boolean {
    return this.hasRole('WORKER');
  }

  /**
   * Check if user is an employer
   */
  isEmployer(): boolean {
    return this.hasRole('EMPLOYER');
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('returnUrl');
    this.userRole = null;
    this.errorService.showInfo('Logged Out', 'You have been successfully logged out.');
    this.router.navigate(['/']);
  }
}
