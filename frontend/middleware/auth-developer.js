import { useAuthStore } from '~/stores/auth';

export default defineNuxtRouteMiddleware((to, from) => {
  const auth = useAuthStore();

  if (!auth.isAuthenticated || auth.user?.role !== 'Developer') {
    return navigateTo('/');
  }
});
