import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { ErrorCode } from '../models/error-response.model';

const addTokenToRequest = (req: HttpRequest<unknown>, token: string) => {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
};

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = localStorage.getItem('access_token');

  // Add token to request if available
  if (token && !req.url.includes('/refresh') && !req.url.includes('/login')) {
    req = addTokenToRequest(req, token);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('Auth interceptor caught error:', error.status, error.error);

      // Only handle token refresh for 401 errors or TOKEN_EXPIRED
      const shouldRefreshToken = error.status === 401 ||
        (error.error?.errorCode === ErrorCode.TOKEN_EXPIRED);

      // Don't attempt refresh for auth endpoints or if already refreshing
      const isAuthEndpoint = req.url.includes('/refresh') ||
                            req.url.includes('/login') ||
                            req.url.includes('/register');

      if (shouldRefreshToken && !isAuthEndpoint) {
        console.log('Attempting token refresh for failed request:', req.url);

        return authService.refreshToken().pipe(
          switchMap((response: any) => {
            console.log('Token refresh successful, retrying original request');

            // Get the new token from localStorage (it was stored in the refresh method)
            const newToken = localStorage.getItem('access_token');

            if (!newToken) {
              console.error('No new token found after refresh');
              return throwError(() => new Error('Token refresh failed: no new token'));
            }

            // Retry the original request with the new token
            const retryReq = addTokenToRequest(req, newToken);
            return next(retryReq);
          }),
          catchError((refreshError) => {
            console.error('Token refresh failed:', refreshError);

            // If refresh fails, logout and redirect
            authService.logout();
            router.navigate(['/login'], {
              queryParams: {
                returnUrl: router.url,
                reason: 'session-expired'
              }
            });

            return throwError(() => refreshError);
          })
        );
      }

      // For all other errors, let the error interceptor handle them
      return throwError(() => error);
    })
  );
};
