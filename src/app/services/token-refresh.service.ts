import { Injectable, OnDestroy } from '@angular/core';
import { AuthService } from './auth.service';
import { interval, Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TokenRefreshService implements OnDestroy {
  private refreshSubscription?: Subscription;
  private readonly REFRESH_INTERVAL = 5 * 60 * 1000; // Check every 5 minutes
  private readonly REFRESH_THRESHOLD = 10 * 60 * 1000; // Refresh if expires within 10 minutes

  constructor(private authService: AuthService) {}

  /**
   * Start automatic token refresh checking
   */
  startTokenRefreshTimer(): void {
    if (this.refreshSubscription) {
      return; // Already started
    }

    console.log('Starting token refresh timer');

    this.refreshSubscription = interval(this.REFRESH_INTERVAL).subscribe(() => {
      this.checkAndRefreshToken();
    });

    // Also check immediately
    this.checkAndRefreshToken();
  }

  /**
   * Stop automatic token refresh checking
   */
  stopTokenRefreshTimer(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
      this.refreshSubscription = undefined;
      console.log('Stopped token refresh timer');
    }
  }

  /**
   * Check if token needs refresh and refresh if necessary
   */
  private checkAndRefreshToken(): void {
    if (!this.authService.isLoggedIn()) {
      return; // User not logged in
    }

    const expiration = this.authService.getTokenExpiration();
    if (!expiration) {
      return; // No valid token
    }

    const now = new Date();
    const timeUntilExpiration = expiration.getTime() - now.getTime();

    console.log(`Token expires in ${Math.round(timeUntilExpiration / 1000 / 60)} minutes`);

    // If token expires within threshold, refresh it
    if (timeUntilExpiration <= this.REFRESH_THRESHOLD) {
      console.log('Token needs refresh, attempting refresh...');
      
      this.authService.refreshToken().subscribe({
        next: () => {
          console.log('Proactive token refresh successful');
        },
        error: (error) => {
          console.error('Proactive token refresh failed:', error);
          // Don't logout here - let the auth interceptor handle it on next request
        }
      });
    }
  }

  ngOnDestroy(): void {
    this.stopTokenRefreshTimer();
  }
}
