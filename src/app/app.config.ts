import {ApplicationConfig, provideZoneChangeDetection} from '@angular/core';
import {provideRouter} from '@angular/router';
import {provideHttpClient, withInterceptors} from '@angular/common/http';
import {provideAnimations} from '@angular/platform-browser/animations';
import {routes} from './app.routes';
import {authInterceptor} from './interceptors/auth.interceptor';
import {errorInterceptor} from './interceptors/error.interceptor';
import {loadingInterceptor} from './interceptors/loading.interceptor';
import {successResponseInterceptor} from './interceptors/success-response.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({eventCoalescing: true}),
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptors([
      successResponseInterceptor,  // FIRST: Fix misclassified 201 responses
      loadingInterceptor,          // SECOND: Start loading states
      authInterceptor,             // THIRD: Add auth headers
      errorInterceptor             // LAST: Handle actual errors
    ]))
  ]
};
