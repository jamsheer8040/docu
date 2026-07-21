import { defineStore } from 'pinia';
import { useNuxtApp } from '#app';

export const useLeadStore = defineStore('leads', {
  state: () => ({
    leads: [],
    loading: false,
    error: null
  }),
  
  actions: {
    async fetchLeads() {
      this.loading = true;
      this.error = null;
      try {
        const { $api } = useNuxtApp();
        const res = await $api.get('/leads');
        if (res.data.success) {
          this.leads = res.data.data;
        }
      } catch (err) {
        this.error = err.message || 'Failed to fetch leads';
      } finally {
        this.loading = false;
      }
    },
    
    async createLead(data) {
      const { $api } = useNuxtApp();
      const res = await $api.post('/leads', data);
      if (res.data.success) {
        this.leads.unshift(res.data.data);
        return res.data.data;
      }
      throw new Error('Failed to create lead');
    },
    
    async updateLead(id, data) {
      const { $api } = useNuxtApp();
      const res = await $api.put(`/leads/${id}`, data);
      if (res.data.success) {
        const index = this.leads.findIndex(l => l.id === id);
        if (index !== -1) {
          this.leads[index] = { ...this.leads[index], ...res.data.data };
        }
        return res.data.data;
      }
      throw new Error('Failed to update lead');
    },
    
    async deleteLead(id) {
      const { $api } = useNuxtApp();
      const res = await $api.delete(`/leads/${id}`);
      if (res.data.success) {
        this.leads = this.leads.filter(l => l.id !== id);
      }
    },
    
    async convertLead(id) {
      const { $api } = useNuxtApp();
      const res = await $api.post(`/leads/${id}/convert`);
      if (res.data.success) {
        const index = this.leads.findIndex(l => l.id === id);
        if (index !== -1) {
          this.leads[index] = { ...this.leads[index], ...res.data.data.lead };
        }
        return res.data;
      }
      throw new Error(res.data.message || 'Failed to convert lead');
    },

    async trackWhatsappClick(id) {
      const index = this.leads.findIndex(l => l.id === id);
      if (index === -1) return;

      // Optimistic update using splice (guaranteed reactive in Vue 3)
      const current = this.leads[index];
      this.leads.splice(index, 1, { ...current, whatsapp_clicks: (current.whatsapp_clicks || 0) + 1 });

      // Sync with backend and update from authoritative server count
      try {
        const { $api } = useNuxtApp();
        const res = await $api.post(`/leads/${id}/whatsapp-click`);
        if (res.data.success) {
          // Update with the real server count
          this.leads.splice(index, 1, { ...this.leads[index], whatsapp_clicks: res.data.whatsapp_clicks });
        }
      } catch (_) {
        // Revert if call completely failed
        this.leads.splice(index, 1, { ...this.leads[index], whatsapp_clicks: current.whatsapp_clicks || 0 });
      }
    }


  }
});
