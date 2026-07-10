import { defineStore } from 'pinia';

export const useInvoiceStore = defineStore('invoices', {
  state: () => ({
    invoices: [],
    currentInvoice: null,
    totalInvoices: 0,
    loading: false,
    error: null
  }),

  actions: {
    async fetchInvoices(params = {}) {
      this.loading = true;
      try {
        const { $api } = useNuxtApp();
        const response = await $api.get('/invoices', { params });
        if (response.data?.success) {
          this.invoices = response.data.data;
          this.totalInvoices = response.data.meta?.total || 0;
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch invoices';
      } finally {
        this.loading = false;
      }
    },

    async fetchInvoiceById(id) {
      this.loading = true;
      try {
        const { $api } = useNuxtApp();
        const response = await $api.get(`/invoices/${id}`);
        if (response.data?.success) {
          this.currentInvoice = response.data.data;
          return response.data.data;
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch invoice details';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async createInvoice(data) {
      this.loading = true;
      try {
        const { $api } = useNuxtApp();
        const response = await $api.post('/invoices', data);
        if (response.data?.success) {
          await this.fetchInvoices();
          return response.data;
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to create invoice';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateInvoice(id, data) {
      this.loading = true;
      try {
        const { $api } = useNuxtApp();
        const response = await $api.put(`/invoices/${id}`, data);
        if (response.data?.success) {
          await this.fetchInvoices();
          if (this.currentInvoice?.id === id) {
              await this.fetchInvoiceById(id);
          }
          return response.data;
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to update invoice';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateStatus(id, status, account_id = null, amount = null) {
      this.loading = true;
      try {
        const { $api } = useNuxtApp();
        const response = await $api.put(`/invoices/${id}/status`, { status, account_id, amount });
        if (response.data?.success) {
          await this.fetchInvoices();
          if (this.currentInvoice?.id === id) {
              await this.fetchInvoiceById(id);
          }
          return response.data;
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to update status';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async downloadPDF(id, invoiceNumber) {
        try {
            const { $api } = useNuxtApp();
            const response = await $api.get(`/invoices/${id}/pdf`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Invoice_${invoiceNumber}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error('Download PDF Error:', err);
            throw new Error('Failed to download PDF');
        }
    },

    async deleteInvoice(id) {
        this.loading = true;
        try {
          const { $api } = useNuxtApp();
          const response = await $api.delete(`/invoices/${id}`);
          if (response.data?.success) {
            await this.fetchInvoices();
          }
        } catch (err) {
          this.error = err.response?.data?.message || 'Failed to delete invoice';
          throw err;
        } finally {
          this.loading = false;
        }
    }
  }
});
