import { defineStore } from 'pinia';

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    stats: {
      total_customers: 0,
      active_documents: 0,
      expiring_soon: 0,
      critical_count: 0,
      monthly_revenue: 0,
      monthly_cost: 0,
      monthly_profit: 0,
      active_service_orders: 0
    },
    recentActivity: {
      recent_invoices: [],
      expiring_documents: []
    },
    loading: false,
    error: null
  }),

  actions: {
    async fetchStats() {
      this.loading = true;
      try {
        const { $api } = useNuxtApp();
        const response = await $api.get('/dashboard/stats');
        if (response.data?.success) {
          this.stats = response.data.data;
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch dashboard statistics';
      } finally {
        this.loading = false;
      }
    },

    async fetchRecentActivity() {
      try {
        const { $api } = useNuxtApp();
        const response = await $api.get('/dashboard/recent-activity');
        if (response.data?.success) {
          this.recentActivity = response.data.data;
        }
      } catch (err) {
        console.error('Recent activity fetch failed', err);
      }
    }
  }
});
