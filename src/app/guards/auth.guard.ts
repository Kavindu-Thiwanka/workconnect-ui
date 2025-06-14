import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    // Check if there is a logged-in user.
    // getCurrentUser() will throw an error if no one is signed in.
    await authService.getCurrentUser();
    return true; // User is authenticated, allow access to the route
  } catch (error) {
    // User is not authenticated, redirect to the login page
    console.log('User not authenticated, redirecting to login.');
    router.navigate(['/login']);
    return false; // Block access to the route
  }
};
