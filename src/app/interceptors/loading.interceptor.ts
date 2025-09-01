import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

/**
 * Loading interceptor to automatically manage loading states for HTTP requests
 */
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  
  // Create a unique key for this request
  const loadingKey = createLoadingKey(req.method, req.url);
  
  // Skip loading for certain requests
  if (shouldSkipLoading(req.url)) {
    return next(req);
  }
  
  // Start loading
  loadingService.setLoading(loadingKey, true);
  
  return next(req).pipe(
    finalize(() => {
      // Stop loading when request completes (success or error)
      loadingService.setLoading(loadingKey, false);
    })
  );
};

/**
 * Create a unique loading key for the request
 */
function createLoadingKey(method: string, url: string): string {
  // Extract the endpoint from the URL for a cleaner key
  const endpoint = extractEndpoint(url);
  return `${method.toLowerCase()}-${endpoint}`;
}

/**
 * Extract endpoint from URL for loading key
 */
function extractEndpoint(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split('/').filter(segment => segment);
    
    // Take the last 2 segments for the key (e.g., 'api/jobs' from '/api/jobs/123')
    const relevantSegments = pathSegments.slice(-2);
    return relevantSegments.join('-') || 'request';
  } catch {
    // Fallback for relative URLs
    const pathSegments = url.split('/').filter(segment => segment);
    const relevantSegments = pathSegments.slice(-2);
    return relevantSegments.join('-') || 'request';
  }
}

/**
 * Determine if loading should be skipped for this URL
 */
function shouldSkipLoading(url: string): boolean {
  const skipPatterns = [
    '/health',
    '/ping',
    '/refresh',
    '/logout'
  ];
  
  return skipPatterns.some(pattern => url.includes(pattern));
}
