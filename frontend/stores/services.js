import { defineStore } from 'pinia'

export const useServiceStore = defineStore('services', {
  state: () => ({
    serviceTypes: [],
    serviceOrders: [],
    totalServiceTypes: 0,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchServiceTypes(params = {}) {
      this.loading = true
      try {
        const { $api } = useNuxtApp()
        const response = await $api.get('/services/types', { params })
        if (response.data.success) {
          this.serviceTypes = response.data.data
          this.totalServiceTypes = response.data.meta?.total || 0
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch service types'
      } finally {
        this.loading = false
      }
    },

    async fetchServiceOrders(params = {}) {
      this.loading = true
      try {
        const { $api } = useNuxtApp()
        const response = await $api.get('/services/orders', { params })
        if (response.data.success) {
          this.serviceOrders = response.data.data
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to fetch service orders'
      } finally {
        this.loading = false
      }
    },

    async createServiceType(data) {
      try {
        const { $api } = useNuxtApp()
        const response = await $api.post('/services/types', data)
        if (response.data.success) {
          this.serviceTypes.push(response.data.data)
          return response.data.data
        }
      } catch (err) {
        throw err.response?.data || err
      }
    },

    async updateServiceType(id, data) {
      try {
        const { $api } = useNuxtApp()
        const response = await $api.put(`/services/types/${id}`, data)
        if (response.data.success) {
          const index = this.serviceTypes.findIndex(t => t.id === id)
          if (index !== -1) this.serviceTypes[index] = response.data.data
          return response.data.data
        }
      } catch (err) {
        throw err.response?.data || err
      }
    },

    async createServiceOrder(data) {
      try {
        const { $api } = useNuxtApp()
        const response = await $api.post('/services/orders', data)
        if (response.data.success) {
          this.serviceOrders.unshift(response.data.data)
          return response.data.data
        }
      } catch (err) {
        throw err.response?.data || err
      }
    },

    async updateOrderStatus(id, status) {
      try {
        const { $api } = useNuxtApp()
        const response = await $api.put(`/services/orders/${id}/status`, { status })
        if (response.data.success) {
          const index = this.serviceOrders.findIndex(o => o.id === id)
          if (index !== -1) this.serviceOrders[index] = response.data.data
          return response.data
        }
      } catch (err) {
        throw err.response?.data || err
      }
    },

    async updateServiceOrder(id, data) {
      try {
        const { $api } = useNuxtApp()
        const response = await $api.put(`/services/orders/${id}`, data)
        if (response.data.success) {
          const index = this.serviceOrders.findIndex(o => o.id === id)
          if (index !== -1) this.serviceOrders[index] = response.data.data
          return response.data.data
        }
      } catch (err) {
        throw err.response?.data || err
      }
    },

    async deleteServiceOrder(id) {
      try {
        const { $api } = useNuxtApp()
        const response = await $api.delete(`/services/orders/${id}`)
        if (response.data.success) {
          this.serviceOrders = this.serviceOrders.filter(o => o.id !== id)
        }
      } catch (err) {
        throw err.response?.data || err
      }
    },

    async incrementReminderCount(id) {
      try {
        const { $api } = useNuxtApp()
        const response = await $api.post(`/services/orders/${id}/remind`)
        if (response.data.success) {
          const index = this.serviceOrders.findIndex(o => o.id === id)
          if (index !== -1) {
            this.serviceOrders[index].reminder_count = response.data.reminder_count
          }
          return response.data
        }
      } catch (err) {
        throw err.response?.data || err
      }
    }
  }
})
