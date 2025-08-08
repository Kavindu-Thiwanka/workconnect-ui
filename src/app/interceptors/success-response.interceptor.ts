import { HttpInterceptorFn, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';

/**
 * Interceptor to fix Angular HttpClient bug where 201 responses are treated as errors
 * This interceptor should be placed BEFORE the error interceptor in the chain
 */
export const successResponseInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Check if this is a misclassified success response (200-299)
      if (error.status >= 200 && error.status < 300) {
        console.log(`Fixed misclassified ${error.status} response for:`, req.url);

        // Create a proper HttpResponse object that won't trigger error handlers
        const successResponse = new HttpResponse({
          body: error.error || {},
          headers: error.headers,
          status: error.status,
          statusText: error.status === 201 ? 'Created' : (error.statusText || 'OK'),
          url: error.url || req.url
        });

        return of(successResponse);
      }

      // If it's a real error, re-throw it
      throw error;
    })
  );
};
