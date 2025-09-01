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

  // If user is logged in, redirect to their dashboard
  const userRole = authService.getRole();
  
  if (userRole === 'WORKER' || userRole === 'EMPLOYER') {
    // Redirect to the app dashboard (which will show role-specific content)
    router.navigate(['/app/dashboard']);
    return false;
  }

  // If role is unknown but user is logged in, redirect to app
  router.navigate(['/app']);
  return false;
};
