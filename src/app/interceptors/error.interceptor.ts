import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, retry, timer, mergeMap } from 'rxjs';
import { ErrorService } from '../services/error.service';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { ErrorCode, ErrorContext } from '../models/error-response.model';

/**
 * HTTP Error Interceptor for centralized error handling
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorService = inject(ErrorService);
  const authService = inject(AuthService);
  const router = inject(Router);

  const retryCount = getRetryCount(req);

  // Only apply retry logic if retry count > 0
  const request$ = retryCount > 0
    ? next(req).pipe(
        retry({
          count: retryCount,
          delay: (error, retryAttempt) => {
            // Only retry on network errors or 5xx server errors
            if (shouldRetry(error, retryAttempt)) {
              return timer(getRetryDelay(retryAttempt));
            }
            throw error;
          }
        })
      )
    : next(req);

  return request$.pipe(
    catchError((error: HttpErrorResponse) => {
      // Skip processing if this is actually a success response (should have been handled by success interceptor)
      if (error.status >= 200 && error.status < 300) {
        console.warn('Error interceptor received success response:', error.status, 'for', req.url);
        return throwError(() => error); // Let it pass through without additional error handling
      }

      const context = createErrorContext(req);

      // Handle specific error types
      if (isAuthenticationError(error)) {
        return handleAuthenticationError(error, context, authService, router, errorService);
      }

      if (isValidationError(error)) {
        handleValidationError(error, context, errorService);
      } else if (isNetworkError(error)) {
        handleNetworkError(error, context, errorService);
      } else if (isServerError(error)) {
        handleServerError(error, context, errorService);
      } else {
        // Handle all other errors through the error service
        errorService.handleError(error, context);
      }

      return throwError(() => error);
    })
  );
};

/**
 * Check if error is authentication related
 */
function isAuthenticationError(error: HttpErrorResponse): boolean {
  if (error.status === 401) return true;

  const errorResponse = error.error;
  if (errorResponse?.errorCode) {
    const authErrorCodes = [
      ErrorCode.AUTHENTICATION_FAILED,
      ErrorCode.TOKEN_EXPIRED,
      ErrorCode.INVALID_TOKEN,
      ErrorCode.INVALID_CREDENTIALS
    ];
    return authErrorCodes.includes(errorResponse.errorCode);
  }

  return false;
}

/**
 * Check if error is validation related
 */
function isValidationError(error: HttpErrorResponse): boolean {
  if (error.status === 400) return true;

  const errorResponse = error.error;
  return errorResponse?.errorCode === ErrorCode.VALIDATION_ERROR ||
         errorResponse?.errorCode === ErrorCode.CONSTRAINT_VIOLATION;
}

/**
 * Check if error is network related
 */
function isNetworkError(error: HttpErrorResponse): boolean {
  return error.status === 0 || !navigator.onLine;
}

/**
 * Check if error is server related
 */
function isServerError(error: HttpErrorResponse): boolean {
  return error.status >= 500;
}

/**
 * Handle authentication errors
 */
function handleAuthenticationError(
  error: HttpErrorResponse,
  context: ErrorContext,
  authService: AuthService,
  router: Router,
  errorService: ErrorService
) {
  const errorResponse = error.error;

  // Skip handling 401 errors and TOKEN_EXPIRED here - let auth interceptor handle them
  if (error.status === 401 || errorResponse?.errorCode === ErrorCode.TOKEN_EXPIRED) {
    // Only handle if this is a refresh endpoint failure (auth interceptor already tried)
    if (context.url.includes('/refresh')) {
      console.log('Refresh endpoint failed, logging out user');
      authService.logout();
      router.navigate(['/login'], {
        queryParams: { returnUrl: router.url, reason: 'session-expired' }
      });

      errorService.showWarning(
        'Session Expired',
        'Your session has expired. Please log in again.',
        0 // Don't auto-dismiss
      );
    }

    // For other 401 errors, let auth interceptor handle them
    return throwError(() => error);
  }

  // Handle invalid credentials
  if (errorResponse?.errorCode === ErrorCode.INVALID_CREDENTIALS) {
    // Don't show notification for login page errors (handled by component)
    if (!context.url.includes('/login')) {
      errorService.handleError(error, context);
    }
    return throwError(() => error);
  }

  // Handle access denied
  if (error.status === 403 || errorResponse?.errorCode === ErrorCode.ACCESS_DENIED) {
    errorService.showWarning(
      'Access Denied',
      'You don\'t have permission to access this resource.',
      6000
    );
    return throwError(() => error);
  }

  // Handle other authentication errors
  errorService.handleError(error, context);
  return throwError(() => error);
}

/**
 * Handle validation errors
 */
function handleValidationError(
  error: HttpErrorResponse,
  context: ErrorContext,
  errorService: ErrorService
): void {
  // For validation errors, we typically want the component to handle them
  // But we still log them for debugging
  console.warn('Validation error occurred:', error, context);

  // Only show notification if it's not a form submission
  if (!context.method.toUpperCase().includes('POST') && !context.method.toUpperCase().includes('PUT')) {
    errorService.handleError(error, context);
  }
}

/**
 * Handle network errors
 */
function handleNetworkError(
  error: HttpErrorResponse,
  context: ErrorContext,
  errorService: ErrorService
): void {
  errorService.handleError(error, context);
}

/**
 * Handle server errors
 */
function handleServerError(
  error: HttpErrorResponse,
  context: ErrorContext,
  errorService: ErrorService
): void {
  errorService.handleError(error, context);
}

/**
 * Create error context for debugging
 */
function createErrorContext(req: HttpRequest<any>): ErrorContext {
  return {
    url: req.url,
    method: req.method,
    timestamp: new Date(),
    userAgent: navigator.userAgent,
    userId: getCurrentUserId(),
    sessionId: getSessionId()
  };
}

/**
 * Get current user ID from token or storage
 */
function getCurrentUserId(): string | undefined {
  try {
    const token = localStorage.getItem('access_token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.sub || payload.userId;
    }
  } catch (e) {
    // Ignore errors
  }
  return undefined;
}

/**
 * Get session ID
 */
function getSessionId(): string | undefined {
  return sessionStorage.getItem('sessionId') || undefined;
}

/**
 * Determine if request should be retried
 */
function shouldRetry(error: HttpErrorResponse, retryCount: number): boolean {
  // Don't retry authentication errors
  if (isAuthenticationError(error)) return false;

  // Don't retry validation errors
  if (isValidationError(error)) return false;

  // Don't retry client errors (4xx except 408, 429)
  if (error.status >= 400 && error.status < 500 &&
      error.status !== 408 && error.status !== 429) {
    return false;
  }

  // Retry network errors and server errors up to 3 times
  return retryCount < 3 && (isNetworkError(error) || isServerError(error));
}

/**
 * Get retry count based on request type
 */
function getRetryCount(req: HttpRequest<any>): number {
  // Don't retry mutations by default
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method.toUpperCase())) {
    return 0;
  }

  // Retry GET requests up to 3 times
  return 3;
}

/**
 * Get retry delay with exponential backoff
 */
function getRetryDelay(retryCount: number): number {
  return Math.min(1000 * Math.pow(2, retryCount), 10000); // Max 10 seconds
}
