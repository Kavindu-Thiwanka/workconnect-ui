import { Injectable, Inject, forwardRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, finalize, throwError, catchError } from 'rxjs';
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
    if (userRole === 'ADMIN') {
      this.router.navigate(['/app/admin/dashboard']);
    } else if (userRole === 'WORKER' || userRole === 'EMPLOYER') {
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
      // If no refresh token, signal an error without logging out here
      // Let the interceptor handle the logout
      return throwError(() => new Error('No refresh token available'));
    }

    console.log('Attempting token refresh...');

    // Create the refresh token request
    this.refreshTokenRequest = this.http.post(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      tap((response: any) => {
        console.log('Token refresh successful:', response);

        // Handle different response structures
        const newAccessToken = response.accessToken || response.access_token || response.token;
        const newRefreshToken = response.refreshToken || response.refresh_token;

        if (!newAccessToken) {
          throw new Error('Invalid refresh response: missing access token');
        }

        // Store the new access token
        this.storeAccessToken(newAccessToken);

        // Update refresh token if provided
        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken);
        }

        console.log('Tokens updated successfully');
      }),
      catchError((error: any) => {
        console.error('Token refresh failed:', error);

        // Clear the refresh token request
        this.refreshTokenRequest = null;

        // Don't logout here - let the error interceptor handle it
        return throwError(() => error);
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

      // Add a small buffer (30 seconds) to account for clock skew
      const bufferTime = 30;

      if (decodedToken.exp < (currentTime + bufferTime)) {
        // Token is expired or about to expire
        // Don't logout here - let the interceptor handle refresh
        return false;
      }

      return true;
    } catch (error) {
      // Invalid token
      console.error('Invalid token detected:', error);
      return false;
    }
  }

  /**
   * Check if token is expired without triggering logout
   */
  public isTokenExpired(): boolean {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return true;
    }

    try {
      const decodedToken: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decodedToken.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  /**
   * Get token expiration time
   */
  public getTokenExpiration(): Date | null {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return null;
    }

    try {
      const decodedToken: any = jwtDecode(token);
      return new Date(decodedToken.exp * 1000);
    } catch (error) {
      return null;
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
    this.refreshTokenRequest = null; // Clear any pending refresh requests
    this.errorService.showInfo('Logged Out', 'You have been successfully logged out.');
    this.router.navigate(['/']);
  }
}
