import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { from, Observable, switchMap, catchError } from 'rxjs';
import { fetchAuthSession } from '@aws-amplify/auth'; // Correct import

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {

  // Convert the promise from fetchAuthSession() into an observable
  return from(fetchAuthSession()).pipe(
    switchMap(({ tokens }) => {
      // 'tokens' will be available if the user is signed in.
      // The idToken is what your backend validates.
      if (tokens?.idToken) {
        // Clone the request and add the Authorization header
        const cloned = req.clone({
          headers: req.headers.set('Authorization', `Bearer ${tokens.idToken}`)
        });
        // Pass the cloned request to the next handler
        return next(cloned);
      }
      // If there are no tokens, proceed with the original request
      return next(req);
    }),
    catchError(() => {
      // If fetchAuthSession() throws an error (e.g., user not logged in),
      // just proceed with the original, unmodified request.
      return next(req);
    })
  );
};
