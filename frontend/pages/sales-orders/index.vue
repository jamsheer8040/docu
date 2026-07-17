<template>
  <v-container fluid class="sales-orders-page py-8 px-6">
    <div class="d-flex justify-space-between align-center mb-8">
      <div>
        <h1 class="text-h3 font-weight-black text-gradient mb-1">Sales Orders</h1>
        <p class="text-subtitle-1 text-secondary font-weight-medium">Manage customer service requests and dispatches</p>
      </div>
      <v-btn
        color="primary"
        size="large"
        prepend-icon="mdi-plus-circle"
        rounded="xl"
        elevation="2"
        class="font-weight-bold"
        @click="openCreateDialog"
      >
        Create Sales Order
      </v-btn>
    </div>

    <!-- Search & Filters -->
    <v-card class="glass-card mb-6 pa-4 rounded-2xl border-light" variant="flat">
      <v-row align="center">
        <v-col cols="12" sm="4">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Search Orders"
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
            bg-color="surface"
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="4">
          <v-select
            v-model="customerFilter"
            :items="customers"
            item-title="name"
            item-value="id"
            label="Filter by Customer"
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
            clearable
            bg-color="surface"
          ></v-select>
        </v-col>
      </v-row>
    </v-card>

    <!-- Data Table -->
    <v-card class="glass-card rounded-2xl border-light overflow-hidden" variant="flat">
      <v-data-table
        :headers="headers"
        :items="filteredSalesOrders"
        :search="search"
        :loading="loading"
        class="bg-transparent"
        hover
      >
        <template v-slot:item.order_number="{ item }">
          <span class="font-weight-black text-primary">{{ item.order_number }}</span>
        </template>

        <template v-slot:item.customer="{ item }">
          <div class="font-weight-bold">{{ item.Customer?.name || 'N/A' }}</div>
          <div class="text-caption text-secondary">{{ item.Customer?.email }}</div>
        </template>

        <template v-slot:item.order_date="{ item }">
          {{ formatDate(item.order_date) }}
        </template>

        <template v-slot:item.services_count="{ item }">
          <v-chip size="small" color="info" variant="flat" class="font-weight-bold">
            {{ item.SalesOrderItems?.length || 0 }} Services
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn
            icon="mdi-eye"
            variant="text"
            color="primary"
            size="small"
            class="mr-2"
            @click="viewOrder(item)"
          ></v-btn>
          <v-btn
            icon="mdi-delete"
            variant="text"
            color="error"
            size="small"
            @click="deleteOrder(item)"
          ></v-btn>
        </template>
      </v-data-table>
    </v-card>

    <SalesOrderDialog
      v-model="dialogVisible"
      :customers="customers"
      :service-types="serviceTypes"
      @saved="fetchData"
    />

    <SalesOrderDetail
      v-model="detailVisible"
      :order="selectedOrder"
      @refresh="fetchData"
    />
  </v-container>
</template>

<script setup>
import { useUIStore } from '~/stores/ui'

const uiStore = useUIStore()
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import SalesOrderDialog from '@/components/sales-orders/SalesOrderDialog.vue'
import SalesOrderDetail from '@/components/sales-orders/SalesOrderDetail.vue'
import { useNuxtApp } from '#app'

const { $api } = useNuxtApp()
const authStore = useAuthStore()

const loading = ref(false)
const search = ref('')
const customerFilter = ref(null)

const salesOrders = ref([])
const customers = ref([])
const serviceTypes = ref([])

const dialogVisible = ref(false)
const detailVisible = ref(false)
const selectedOrder = ref(null)

const headers = [
  { title: 'Order No.', key: 'order_number', sortable: true },
  { title: 'Customer', key: 'customer', sortable: true },
  { title: 'Date', key: 'order_date', sortable: true },
  { title: 'Contact Person', key: 'contact_person', sortable: true },
  { title: 'Total Services', key: 'services_count', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
]

const filteredSalesOrders = computed(() => {
  let list = salesOrders.value
  if (customerFilter.value) {
    list = list.filter(o => o.customer_id === customerFilter.value)
  }
  return list
})

const fetchData = async () => {
  loading.value = true
  try {
    const [ordersRes, custRes, servRes] = await Promise.all([
      $api.get('/sales-orders'),
      $api.get('/customers'),
      $api.get('/services/types')
    ])
    salesOrders.value = ordersRes.data.data
    customers.value = custRes.data.data
    serviceTypes.value = servRes.data.data
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})

const openCreateDialog = () => {
  dialogVisible.value = true
}

const viewOrder = (item) => {
  selectedOrder.value = item
  detailVisible.value = true
}

const deleteOrder = async (item) => {
  if (!confirm(`Are you sure you want to delete ${item.order_number}?`)) return
  try {
    await $api.delete(`/sales-orders/${item.id}`)
    fetchData()
  } catch (err) {
    console.error(err)
    uiStore.showError('Failed to delete')
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString()
}
</script>

<style scoped>
.sales-orders-page {
  max-width: 1600px;
  margin: 0 auto;
}
.text-gradient {
  background: linear-gradient(135deg, #2563eb 0%, #4f46e5 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.glass-card {
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05) !important;
}
.border-light {
  border: 1px solid rgba(226, 232, 240, 0.8);
}
</style>
