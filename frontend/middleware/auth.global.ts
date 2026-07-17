import { useAuthStore } from '~/stores/auth';
import { useConfigStore } from '~/stores/config';

export default defineNuxtRouteMiddleware((to, from) => {
  if (import.meta.server) return;

  const nuxtApp = useNuxtApp();
  const authStore = useAuthStore(nuxtApp.$pinia);
  const configStore = useConfigStore(nuxtApp.$pinia);

  // License Expiry Check
  // Allow login page, expired page, and developer to bypass expiry block
  const bypassRoutes = ['/login', '/login/', '/expired', '/expired/', '/developer', '/developer/', '/saas-portal', '/saas-portal/'];
  if (configStore.isExpired && !bypassRoutes.includes(to.path) && authStore.user?.role !== 'Developer') {
     return navigateTo('/expired');
  }

  // Public pages that don't require authentication
  const publicPages = ['/login', '/register', '/login/', '/register/'];
  const authRequired = !publicPages.includes(to.path);

  if (authRequired && !authStore.isAuthenticated) {
    return navigateTo('/login');
  }

  if (['/login', '/login/'].includes(to.path) && authStore.isAuthenticated) {
    if (authStore.user?.role === 'Developer') {
      return navigateTo('/saas-portal');
    }
    if (authStore.user?.role_type === 'CustomerPortal') {
      return navigateTo('/documents');
    }
    return navigateTo('/');
  }

  if (to.path === '/' && authStore.isAuthenticated && authStore.user?.role_type === 'CustomerPortal') {
    return navigateTo('/documents');
  }

  // Developer Strict Access Guard
  // A developer should ONLY be allowed on the /developer and /saas-portal pages.
  if (authStore.isAuthenticated && authStore.user?.role === 'Developer' && !['/developer', '/developer/', '/saas-portal', '/saas-portal/'].includes(to.path)) {
    return navigateTo('/saas-portal');
  }

  // RBAC Check for protected routes
  if (authRequired && authStore.isAuthenticated) {
    const routePermissions: Record<string, string> = {
      '/customers': 'customers',
      '/documents': 'documents',
      '/sales-orders': 'sales_orders',
      '/services': 'services',
      '/invoices': 'invoices',
      '/expenses': 'expenses',
      '/wallet': 'wallet',
      '/reports': 'reports',
      '/settings': 'settings',
      '/management': 'management'
    };

    // Find if the current path (or any parent path) requires a permission
    const requiredModule = Object.keys(routePermissions).find(routePath => to.path.startsWith(routePath));
    
    if (requiredModule) {
      const moduleName = routePermissions[requiredModule];
      if (!authStore.can(moduleName, 'read')) {
        console.warn(`Access denied to ${to.path}. Missing ${moduleName} permission.`);
        return navigateTo('/'); // Redirect to dashboard if no permission
      }
    }
  }
});
