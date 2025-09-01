import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard - Protects authenticated routes
 * Redirects unauthenticated users to login page
 * Handles role-based access if needed
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    // User is authenticated, check if token is valid
    const userRole = authService.getRole();

    if (!userRole) {
      // Token might be invalid, redirect to login
      authService.logout();
      return false;
    }

    return true;
  } else {
    // User is not authenticated, redirect to login
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }
};
