import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Root Redirect Guard - Handles initial routing logic
 * - Authenticated users: Redirect to role-specific dashboard
 * - Unauthenticated users: Allow access to home page
 */
export const rootRedirectGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated
  if (authService.isLoggedIn()) {
    // Force role detection to ensure we have the latest role
    const userRole = authService.getRole();

    // Validate that we have a valid role
    if (!userRole) {
      // Token might be invalid, logout and show home page
      authService.logout();
      return true; // Allow access to home page after logout
    }

    // Redirect authenticated users to their role-specific dashboard
    if (userRole === 'ADMIN') {
      router.navigate(['/app/admin/dashboard']);
      return false;
    } else if (userRole === 'WORKER' || userRole === 'EMPLOYER') {
      router.navigate(['/app/dashboard']);
      return false;
    } else {
      // Unknown role but authenticated, redirect to app
      router.navigate(['/app']);
      return false;
    }
  }

  // User is not authenticated, allow access to home page
  return true;
};
