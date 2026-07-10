import { defineStore } from 'pinia';
import { useAuthStore } from './auth';

export const useDocumentStore = defineStore('documents', {
  state: () => ({
    documents: [],
    groupedDocs: {},
    stages: [],
    totalDocuments: 0,
    loading: false,
    error: null
  }),

  actions: {
    async fetchExpiring() {
      this.loading = true;
      try {
        const { $api } = useNuxtApp();
        const authStore = useAuthStore();
        const params = {};
        if (authStore.customerFilterParam) {
          params.customer_id = authStore.customerFilterParam;
        }
        const response = await $api.get('/documents/expiring', { params });
        if (response.data?.success) {
          if (response.data.data.stages && response.data.data.grouped) {
            this.stages = response.data.data.stages;
            this.groupedDocs = response.data.data.grouped;
          } else {
            this.groupedDocs = response.data.data;
          }
          return response.data.data;
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch expiring documents';
      } finally {
        this.loading = false;
      }
    },

    async fetchDocuments(params = {}) {
      this.loading = true;
      try {
        const { $api } = useNuxtApp();
        const authStore = useAuthStore();
        if (authStore.customerFilterParam && !params.customer_id) {
          params.customer_id = authStore.customerFilterParam;
        }
        const response = await $api.get('/documents', { params });
        if (response.data?.success) {
          this.documents = response.data.data;
          this.totalDocuments = response.data.meta?.total || 0;
          return response.data;
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch document list';
      } finally {
        this.loading = false;
      }
    },

    async createDocument(data) {
      this.loading = true;
      try {
        const { $api } = useNuxtApp();
        // If data is NOT FormData, ensure it's handled (multiparts require FormData)
        const response = await $api.post('/documents', data);
        if (response.data?.success) {
          await this.fetchExpiring();
          return response.data;
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to create document';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async updateDocument(id, data) {
      this.loading = true;
      try {
        const { $api } = useNuxtApp();
        const response = await $api.put(`/documents/${id}`, data);
        if (response.data?.success) {
          await this.fetchExpiring();
          return response.data;
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to update document';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async deleteDocument(id) {
      this.loading = true;
      try {
        const { $api } = useNuxtApp();
        const response = await $api.delete(`/documents/${id}`);
        if (response.data?.success) {
          await this.fetchExpiring();
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to delete document';
        throw err;
      } finally {
        this.loading = false;
      }
    },

    async incrementReminderCount(id) {
      try {
        const { $api } = useNuxtApp();
        const response = await $api.post(`/documents/${id}/remind`);
        if (response.data?.success) {
          const newCount = response.data.reminder_count;
          const doc = this.documents.find(d => d.id === id);
          if (doc) {
            doc.reminder_count = newCount;
          }
          for (const key in this.groupedDocs) {
            if (Array.isArray(this.groupedDocs[key])) {
              const d = this.groupedDocs[key].find(item => item.id === id);
              if (d) {
                d.reminder_count = newCount;
              }
            }
          }
          await this.fetchExpiring();
          return response.data;
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to update reminder count';
        throw err;
      }
    }
  }
});
