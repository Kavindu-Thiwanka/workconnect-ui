// Debug script to test admin guard execution
// Run this in browser console to diagnose admin guard issues

export function debugAdminGuard() {
  console.log('=== ADMIN GUARD DIAGNOSTIC TEST ===');
  
  // Test 1: Check if user is logged in
  const token = localStorage.getItem('access_token');
  console.log('1. Token exists:', !!token);
  
  if (token) {
    console.log('2. Token value (first 50 chars):', token.substring(0, 50) + '...');
    
    // Test 2: Try to decode token manually
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const decodedToken = JSON.parse(jsonPayload);
      console.log('3. Decoded token:', decodedToken);
      console.log('4. Role in token:', decodedToken.role);
      
      // Test 3: Check token expiration
      const now = Math.floor(Date.now() / 1000);
      const isExpired = decodedToken.exp < now;
      console.log('5. Token expired:', isExpired);
      console.log('6. Token expires at:', new Date(decodedToken.exp * 1000));
      
    } catch (error) {
      console.error('3. Error decoding token:', error);
    }
  }
  
  // Test 4: Check AuthService state
  try {
    // Try to get AuthService instance
    const authService = (window as any).ng?.getComponent?.(document.body)?.injector?.get?.('AuthService');
    if (authService) {
      console.log('7. AuthService found');
      console.log('8. isLoggedIn():', authService.isLoggedIn());
      console.log('9. getRole():', authService.getRole());
      console.log('10. isAdmin():', authService.isAdmin?.());
    } else {
      console.log('7. AuthService not accessible via window.ng');
    }
  } catch (error) {
    console.error('7. Error accessing AuthService:', error);
  }
  
  // Test 5: Check current route
  console.log('11. Current URL:', window.location.href);
  console.log('12. Current pathname:', window.location.pathname);
  
  // Test 6: Check if we're in admin route
  const isAdminRoute = window.location.pathname.includes('/app/admin');
  console.log('13. Is admin route:', isAdminRoute);
  
  console.log('=== END DIAGNOSTIC TEST ===');
  
  // Instructions
  console.log('\n=== INSTRUCTIONS ===');
  console.log('1. Copy this entire function into browser console');
  console.log('2. Run: debugAdminGuard()');
  console.log('3. Check the output above');
  console.log('4. Try navigating to /app/admin/dashboard and run again');
  console.log('5. Look for any errors or unexpected values');
}

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  (window as any).debugAdminGuard = debugAdminGuard;
  console.log('Debug function loaded. Run: debugAdminGuard()');
}
