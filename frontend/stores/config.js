import { defineStore } from 'pinia';

export const useConfigStore = defineStore('config', {
  state: () => ({
    settings: {
      app_name: 'DocClear',
      app_logo: '',
      license_expiry_date: null
    },
    loading: false
  }),

  getters: {
    appName: (state) => state.settings.app_name || 'DocClear',
    appLogo: (state) => state.settings.app_logo || null,
    isExpired: (state) => {
      if (!state.settings.license_expiry_date) return false;
      return new Date() > new Date(state.settings.license_expiry_date);
    }
  },

  actions: {
    async fetchSettings() {
      this.loading = true;
      try {
        const { $api } = useNuxtApp();
        const config = useRuntimeConfig();
        const baseUrl = config.public.apiBase.replace('/api/v1', '');
        
        const res = await $api.get('/config');
        if (res.data.success) {
          const data = res.data.data;
          
          // Resolve Logo URL
          if (data.app_logo && !data.app_logo.startsWith('http')) {
            data.app_logo = `${baseUrl}${data.app_logo}`;
          }
          
          this.settings = data;
        }
      } catch (err) {
        console.error('[Config Store] Failed to fetch settings:', err);
      } finally {
        this.loading = false;
      }
    }
  }
});
