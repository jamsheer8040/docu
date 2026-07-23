import { defineStore } from 'pinia'
import { useAuthStore } from './auth'

export const useManagementStore = defineStore('management', {
  state: () => ({
    dashboardStats: null,
    shareholders: [],
    capitalTransactions: [],
    dividends: [],
    loading: false,
    error: null
  }),

  actions: {
    async fetchDashboardStats() {
      this.loading = true
      try {
        const { $api } = useNuxtApp()
        const response = await $api.get('/management/dashboard')
        this.dashboardStats = response.data.data
        return this.dashboardStats
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch dashboard stats'
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchShareholders() {
      this.loading = true
      try {
        const { $api } = useNuxtApp()
        const response = await $api.get('/management/shareholders')
        this.shareholders = response.data.data
        return this.shareholders
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch shareholders'
        throw error
      } finally {
        this.loading = false
      }
    },

    async createShareholder(data) {
      this.loading = true
      try {
        const { $api } = useNuxtApp()
        const response = await $api.post('/management/shareholders', data)
        await this.fetchShareholders()
        return response.data.data
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    async updateShareholder(id, data) {
      this.loading = true
      try {
        const { $api } = useNuxtApp()
        const response = await $api.put(`/management/shareholders/${id}`, data)
        await this.fetchShareholders()
        return response.data.data
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchCapitalTransactions() {
      this.loading = true
      try {
        const { $api } = useNuxtApp()
        const response = await $api.get('/management/capital-transactions')
        this.capitalTransactions = response.data.data
        return this.capitalTransactions
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch capital transactions'
        throw error
      } finally {
        this.loading = false
      }
    },

    async createCapitalTransaction(data) {
      this.loading = true
      try {
        const { $api } = useNuxtApp()
        const response = await $api.post('/management/capital-transactions', data)
        await this.fetchCapitalTransactions()
        await this.fetchShareholders()
        return response.data.data
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    async fetchDividends() {
      this.loading = true
      try {
        const { $api } = useNuxtApp()
        const response = await $api.get('/management/dividends')
        this.dividends = response.data.data
        return this.dividends
      } catch (error) {
        this.error = error.response?.data?.message || 'Failed to fetch dividends'
        throw error
      } finally {
        this.loading = false
      }
    },

    async declareDividend(data) {
      this.loading = true
      try {
        const { $api } = useNuxtApp()
        const response = await $api.post('/management/dividends', data)
        await this.fetchDividends()
        return response.data.data
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    },

    async payDividend(data) {
      this.loading = true
      try {
        const { $api } = useNuxtApp()
        const response = await $api.post('/management/dividends/pay', data)
        await this.fetchDividends()
        return response.data.data
      } catch (error) {
        throw error
      } finally {
        this.loading = false
      }
    }
  }
})
