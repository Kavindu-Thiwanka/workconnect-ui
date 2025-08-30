import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Admin Guard - Protects admin routes
 * Only allows users with ADMIN role to access admin routes
 * Assumes user is already authenticated (checked by parent authGuard)
 * Redirects non-admin users to their appropriate dashboard
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // First check if user is logged in
  if (!authService.isLoggedIn()) {
    // User is not authenticated, redirect to login
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url }
    });
    return false;
  }

  const userRole = authService.getRole();

  if (userRole === 'ADMIN') {
    return true;
  } else {
    // User is authenticated but not an admin, redirect to their appropriate dashboard
    if (userRole === 'WORKER' || userRole === 'EMPLOYER') {
      router.navigate(['/app/dashboard']);
    } else {
      // Fallback for unknown roles
      router.navigate(['/app']);
    }
    return false;
  }
};
