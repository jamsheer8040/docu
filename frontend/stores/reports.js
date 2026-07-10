import { defineStore } from 'pinia';
import dayjs from 'dayjs';

export const useReportStore = defineStore('reports', {
  state: () => ({
    filters: {
      from: dayjs().startOf('month').format('YYYY-MM-DD'),
      to: dayjs().format('YYYY-MM-DD')
    },
    summary: {
      total_revenue: 0,
      total_cost: 0,
      net_profit: 0,
      profit_margin: 0,
      invoice_count: 0
    },
    trends: {
      labels: [],
      revenue: [],
      cost: []
    },
    revenueByService: [],
    expensesByCategory: [],
    topCustomers: [],
    loading: false
  }),

  actions: {
    setFilters(from, to) {
      this.filters.from = from;
      this.filters.to = to;
    },

    async fetchAllReports() {
      this.loading = true;
      try {
        const { $api } = useNuxtApp();
        const params = { from: this.filters.from, to: this.filters.to };

        const [summary, trends, revenue, expenses, customers] = await Promise.all([
          $api.get('/reports/financial-summary', { params }),
          $api.get('/reports/monthly-trends', { params }),
          $api.get('/reports/revenue-by-service', { params }),
          $api.get('/reports/expense-by-category', { params }),
          $api.get('/reports/customer-summary', { params })
        ]);

        if (summary.data.success) this.summary = summary.data.data;
        
        if (trends.data.success) {
            const tData = trends.data.data;
            this.trends.labels = tData.trends.map(t => t.month);
            this.trends.revenue = tData.trends.map(t => parseFloat(t.revenue));
            this.trends.cost = tData.costs.map(c => parseFloat(c.cost));
        }

        if (revenue.data.success) this.revenueByService = revenue.data.data;
        if (expenses.data.success) this.expensesByCategory = expenses.data.data;
        if (customers.data.success) this.topCustomers = customers.data.data;

      } catch (err) {
        console.error('Reports fetch failed', err);
      } finally {
        this.loading = false;
      }
    }
  }
});
