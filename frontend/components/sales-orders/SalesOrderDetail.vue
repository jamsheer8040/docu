<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="1200" scrollable>
    <v-card class="rounded-xl glass-card" v-if="order">
      <v-card-title class="pa-6 border-b d-flex align-center justify-space-between bg-surface">
        <div>
          <span class="text-h5 font-weight-black text-primary mr-3">{{ order.order_number }}</span>
          <v-chip size="small" color="secondary" variant="flat" class="font-weight-bold">{{ formatDate(order.order_date) }}</v-chip>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="$emit('update:modelValue', false)"></v-btn>
      </v-card-title>

      <v-card-text class="pa-6 bg-transparent" style="max-height: 80vh">
        <!-- Header Info -->
        <v-row class="mb-6">
          <v-col cols="12" md="3">
            <div class="text-caption text-secondary font-weight-bold text-uppercase mb-1">Customer</div>
            <div class="font-weight-bold text-body-1">{{ order.Customer?.name || 'N/A' }}</div>
            <div class="text-caption">{{ order.Customer?.email }}</div>
          </v-col>
          <v-col cols="12" md="3">
            <div class="text-caption text-secondary font-weight-bold text-uppercase mb-1">Contact Person</div>
            <div class="font-weight-medium">{{ order.contact_person || '-' }}</div>
          </v-col>
          <v-col cols="12" md="3">
            <div class="text-caption text-secondary font-weight-bold text-uppercase mb-1">Customer Reference</div>
            <div class="font-weight-medium">{{ order.customer_reference || '-' }}</div>
          </v-col>
          <v-col cols="12" md="3">
            <div class="text-caption text-secondary font-weight-bold text-uppercase mb-1">Branch</div>
            <div class="font-weight-medium">{{ order.branch || '-' }}</div>
          </v-col>
          <v-col cols="12" v-if="order.internal_remarks">
            <v-alert color="info" variant="tonal" class="rounded-lg">
              <div class="font-weight-bold mb-1">Internal Remarks</div>
              <div>{{ order.internal_remarks }}</div>
            </v-alert>
          </v-col>
        </v-row>

        <h3 class="text-h6 font-weight-bold mb-4">Requested Services</h3>
        <v-table class="bg-surface border rounded-xl overflow-hidden">
          <thead>
            <tr>
              <th class="font-weight-bold">Service</th>
              <th class="font-weight-bold">Qty</th>
              <th class="font-weight-bold">Price</th>
              <th class="font-weight-bold">Priority</th>
              <th class="font-weight-bold">Expected Time</th>
              <th class="font-weight-bold">Status</th>
              <th class="font-weight-bold text-end">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in order.SalesOrderItems" :key="item.id" class="align-center">
              <td class="py-3">
                <div class="font-weight-bold">{{ item.service_name }}</div>
                <div class="text-caption text-secondary">{{ item.description }}</div>
              </td>
              <td>{{ item.quantity }}</td>
              <td>AED {{ item.estimated_price }}</td>
              <td>
                <v-chip size="x-small" :color="getPriorityColor(item.priority)" class="font-weight-bold text-uppercase">{{ item.priority }}</v-chip>
              </td>
              <td>{{ item.expected_processing_time || '-' }}</td>
              <td>
                <v-chip size="small" :color="getStatusColor(item.status)" class="font-weight-bold">
                  {{ getStatusLabel(item.status) }}
                </v-chip>
                <div v-if="item.status === 'CompletedInvoiceCreated' && item.invoice" class="mt-1">
                  <span 
                    class="text-caption text-primary font-weight-black cursor-pointer text-decoration-underline"
                    @click="openInvoiceView(item.invoice)"
                  >
                    <v-icon size="x-small" icon="mdi-receipt-text-outline" class="mr-1"></v-icon>
                    {{ item.invoice.invoice_number }}
                  </span>
                </div>
              </td>
              <td class="text-end">
                <v-btn
                  v-if="!item.service_order_id"
                  color="primary"
                  size="small"
                  variant="flat"
                  rounded="lg"
                  class="font-weight-bold text-none"
                  prepend-icon="mdi-send"
                  @click="pushService(item)"
                  :loading="pushing === item.id"
                >
                  Push to Service
                </v-btn>
                <v-btn
                  v-else
                  color="secondary"
                  size="small"
                  variant="outlined"
                  rounded="lg"
                  class="font-weight-bold text-none"
                  prepend-icon="mdi-open-in-new"
                  @click="viewService(item.service_order_id)"
                >
                  View Service
                </v-btn>
              </td>
            </tr>
            <tr v-if="!order.SalesOrderItems?.length">
              <td colspan="7" class="text-center pa-4 text-secondary opacity-60">No services found for this order.</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>
  </v-dialog>

  <!-- Invoice Detail View Dialog -->
  <v-dialog v-model="invoiceDetailVisible" max-width="900px">
    <InvoiceDetailView
      v-if="invoiceDetailVisible"
      :invoice-id="selectedInvoiceId"
      @close="invoiceDetailVisible = false"
    />
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue'
import { useNuxtApp } from '#app'
import { useRouter } from 'vue-router'
import { useUIStore } from '~/stores/ui'
import InvoiceDetailView from '~/components/invoices/InvoiceDetailView.vue'

const uiStore = useUIStore()

const props = defineProps({
  modelValue: Boolean,
  order: Object
})

const emit = defineEmits(['update:modelValue', 'refresh'])
const { $api } = useNuxtApp()
const router = useRouter()

const pushing = ref(null)
const invoiceDetailVisible = ref(false)
const selectedInvoiceId = ref(null)

const openInvoiceView = (invoice) => {
  selectedInvoiceId.value = invoice.id
  invoiceDetailVisible.value = true
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString()
}

const getPriorityColor = (priority) => {
  const map = { Normal: 'info', Moderate: 'warning', Critical: 'error' }
  return map[priority] || 'secondary'
}

const getStatusColor = (status) => {
  const map = {
    'Not Started': 'secondary',
    'Pending': 'warning',
    'In Progress': 'primary',
    'CompletedInvoicePending': 'orange',
    'CompletedInvoiceCreated': 'success',
    'Cancelled': 'error'
  }
  return map[status] || 'grey'
}

const getStatusLabel = (status) => {
  const map = {
    'Not Started': 'Not Started',
    'Pending': 'Pending',
    'In Progress': 'In Progress',
    'CompletedInvoicePending': 'Completed - Invoice Pending',
    'CompletedInvoiceCreated': 'Completed - Invoice Created',
    'Cancelled': 'Cancelled'
  }
  return map[status] || status || 'Not Started'
}

const pushService = async (item) => {
  if (!confirm(`Are you sure you want to dispatch "${item.service_name}" to the execution team?`)) return
  
  pushing.value = item.id
  try {
    const res = await $api.post(`/sales-orders/items/${item.id}/push`)
    uiStore.showSuccess(res.data.message)
    emit('refresh') // Refreshes parent to get updated order info
    
    // We should close the modal or ideally just wait for the refresh to update the items.
    // Parent refresh will eventually update `order.SalesOrderItems` from the API.
  } catch (err) {
    console.error(err)
    uiStore.showError(err.response?.data?.message || 'Failed to push service')
  } finally {
    pushing.value = null
  }
}

const viewService = (serviceOrderId) => {
  // Emit event to close this dialog and navigate
  emit('update:modelValue', false)
  // Assuming the Services module is at /services?id=... or we can just go to /services
  // For now we just route to /services. The user can find it.
  router.push(`/services?search=SRV-${String(serviceOrderId).padStart(5, '0')}`)
}
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(20px);
}
</style>
