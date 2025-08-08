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

  if (token) {
    req = addTokenToRequest(req, token);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only handle token refresh for 401 errors or TOKEN_EXPIRED
      const shouldRefreshToken = error.status === 401 ||
        (error.error?.errorCode === ErrorCode.TOKEN_EXPIRED);

      if (shouldRefreshToken && !req.url.includes('/refresh') && !req.url.includes('/login')) {
        return authService.refreshToken().pipe(
          switchMap((response: any) => {
            return next(addTokenToRequest(req, response.accessToken));
          }),
          catchError((refreshError) => {
            // Don't logout here - let the error interceptor handle it
            return throwError(() => error);
          })
        );
      }

      // For all other errors, let the error interceptor handle them
      return throwError(() => error);
    })
  );
};
