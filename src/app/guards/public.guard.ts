import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Public Guard - Prevents authenticated users from accessing public pages
 * Redirects authenticated users to their role-specific dashboard
 */
export const publicGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // If user is not logged in, allow access to public pages
  if (!authService.isLoggedIn()) {
    return true;
  }

  // If user is logged in, redirect to their role-specific dashboard
  const userRole = authService.getRole();

  // Validate that we have a valid role
  if (!userRole) {
    // Token might be invalid, logout and allow access to public page
    authService.logout();
    return true;
  }

  if (userRole === 'ADMIN') {
    // Redirect admin users to admin dashboard
    router.navigate(['/app/admin/dashboard']);
    return false;
  } else if (userRole === 'WORKER' || userRole === 'EMPLOYER') {
    // Redirect regular users to app dashboard
    router.navigate(['/app/dashboard']);
    return false;
  } else {
    // If role is unknown but user is logged in, redirect to app
    router.navigate(['/app']);
    return false;
  }
};
