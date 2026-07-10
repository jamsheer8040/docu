<template>
  <v-card class="pa-4 rounded-xl">
    <v-card-title class="pa-6 d-flex align-center">
      <div class="text-h5 font-weight-bold">
        <v-icon icon="mdi-receipt-text-plus-outline" class="mr-3" color="primary"></v-icon>
        {{ isEdit ? 'Edit Invoice' : 'Create Invoice' }}
      </div>
      <v-spacer></v-spacer>
      <v-btn icon="mdi-close" variant="text" @click="$emit('cancel')"></v-btn>
    </v-card-title>

    <v-card-text>
      <!-- Invoice Type Toggle -->
      <v-row class="mb-6" v-if="!isEdit">
        <v-col cols="12" class="d-flex justify-center">
          <v-btn-toggle
            v-model="invoiceType"
            mandatory
            color="primary"
            variant="text"
            density="comfortable"
            class="d-flex gap-2"
          >
            <v-btn
              value="service"
              rounded="lg"
              class="px-6 font-weight-bold border"
              :variant="invoiceType === 'service' ? 'flat' : 'outlined'"
              prepend-icon="mdi-briefcase-outline"
            >
              Service Invoice
            </v-btn>
            <v-btn
              value="manual"
              rounded="lg"
              class="px-6 font-weight-bold border"
              :variant="invoiceType === 'manual' ? 'flat' : 'outlined'"
              prepend-icon="mdi-pencil-box-outline"
            >
              Manual Invoice
            </v-btn>
          </v-btn-toggle>
        </v-col>
      </v-row>

      <v-form ref="form" v-model="valid">
        <v-row>
          <!-- If Service Invoice: Service Order Selection -->
          <v-col cols="12" md="6" v-if="invoiceType === 'service'">
            <v-autocomplete
              v-model="state.service_order_id"
              :items="serviceOrders"
              :item-title="item => `${item.Customer?.name} - ${item.ServiceType?.name} (${item.status})`"
              item-value="id"
              label="Choose Service Order *"
              placeholder="Search active assigned service"
              :rules="[v => !!v || 'Service Order is required']"
              variant="outlined"
              density="comfortable"
              :loading="loadingServiceOrders"
              @update:model-value="onServiceOrderSelected"
            ></v-autocomplete>
          </v-col>

          <!-- Customer Selection -->
          <v-col cols="12" md="6">
            <v-autocomplete
              v-model="state.customer_id"
              :items="customers"
              item-title="name"
              item-value="id"
              label="Customer *"
              placeholder="Search by name"
              :rules="[v => !!v || 'Customer is required']"
              variant="outlined"
              density="comfortable"
              :loading="loadingCustomers"
              :readonly="invoiceType === 'service'"
              :hint="invoiceType === 'service' ? 'Automatically set from Service Order' : ''"
              persistent-hint
            ></v-autocomplete>
          </v-col>

          <!-- Date Selection -->
          <v-col cols="12" md="6">
            <v-text-field
              v-model="state.due_date"
              label="Due Date"
              type="date"
              variant="outlined"
              density="comfortable"
            ></v-text-field>
          </v-col>
        </v-row>

        <v-divider class="my-6"></v-divider>

        <!-- Itemized Table Header -->
        <div class="d-flex align-center mb-4 px-2">
          <div class="text-subtitle-1 font-weight-bold">Invoice Items</div>
          <v-spacer></v-spacer>
          <v-btn
            v-if="invoiceType === 'manual'"
            prepend-icon="mdi-plus"
            variant="tonal"
            color="primary"
            size="small"
            @click="addItem"
          >
            Add Item
          </v-btn>
        </div>

        <div v-for="(item, index) in state.items" :key="index" class="item-row mb-4 pa-4 border rounded-xl bg-surface-variant-light">
          <v-row dense align="center">
            <!-- Item selection from catalog (For Manual Invoice) -->
            <v-col cols="12" md="6" v-if="invoiceType === 'manual'">
              <v-combobox
                v-model="item.selectedItem"
                :items="serviceTypes"
                item-title="name"
                label="Item / Service Name *"
                placeholder="Select from existing catalog or type custom name"
                :rules="[v => !!v || 'Item name is required']"
                hide-details="auto"
                variant="outlined"
                density="comfortable"
                @update:model-value="(val) => onItemCatalogSelected(index, val)"
              ></v-combobox>
            </v-col>

            <!-- Text Field Description (For Service Invoice or read-only display) -->
            <v-col cols="12" md="6" v-else>
              <v-text-field
                v-model="item.description"
                label="Description *"
                placeholder="Service Description"
                :rules="[v => !!v || 'Required']"
                hide-details="auto"
              ></v-text-field>
            </v-col>

            <v-col cols="3" md="1">
              <v-text-field
                v-model.number="item.quantity"
                label="Qty"
                type="number"
                min="1"
                hide-details="auto"
                @input="calculateRow(index)"
              ></v-text-field>
            </v-col>
            <v-col cols="4" md="2">
              <v-text-field
                v-model.number="item.unit_price"
                label="Price"
                prefix="AED"
                type="number"
                hide-details="auto"
                @input="calculateRow(index)"
              ></v-text-field>
            </v-col>
            <v-col cols="4" md="2">
              <div class="text-right pt-4 px-2">
                 <div class="text-caption opacity-60">Total</div>
                 <div class="font-weight-bold text-subtitle-1">AED {{ item.total.toFixed(2) }}</div>
              </div>
            </v-col>
            <v-col cols="1" class="text-right" v-if="invoiceType === 'manual'">
              <v-btn
                v-if="state.items.length > 1"
                icon="mdi-minus-circle-outline"
                variant="text"
                color="error"
                size="small"
                @click="removeItem(index)"
              ></v-btn>
            </v-col>
          </v-row>
        </div>

        <!-- Totals & Notes Section -->
        <v-row class="mt-4">
          <v-col cols="12" md="7">
            <v-textarea
              v-model="state.notes"
              label="Notes & Payment Terms"
              rows="3"
              placeholder="e.g. Terms and conditions, payment info, etc."
              variant="outlined"
              class="mb-4"
            ></v-textarea>
          </v-col>
          <v-col cols="12" md="5" class="bg-grey-lighten-5 rounded-xl pa-6 border">
            <div class="d-flex justify-space-between mb-4">
              <span class="opacity-70">Subtotal</span>
              <span class="font-weight-bold">AED {{ totals.subtotal.toFixed(2) }}</span>
            </div>
            
            <div class="d-flex align-center mb-4">
              <span class="opacity-70">Discount</span>
              <v-spacer></v-spacer>
              <v-text-field
                v-model.number="state.discount"
                prefix="AED"
                type="number"
                density="compact"
                hide-details
                style="max-width: 100px;"
                class="bg-white ml-2"
              ></v-text-field>
            </div>

            <div class="d-flex align-center mb-6">
              <span class="opacity-70">Tax (VAT 5%)</span>
              <v-spacer></v-spacer>
              <v-text-field
                v-model.number="state.tax"
                prefix="AED"
                type="number"
                density="compact"
                hide-details
                style="max-width: 100px;"
                class="bg-white ml-2"
              ></v-text-field>
            </div>

            <v-divider class="mb-4"></v-divider>

            <div class="d-flex justify-space-between align-center">
              <span class="text-h6 font-weight-bold">Grand Total</span>
              <span class="text-h5 font-weight-bold text-primary">AED {{ totals.total.toFixed(2) }}</span>
            </div>
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>

    <v-card-actions class="pa-6">
      <v-spacer></v-spacer>
      <v-btn variant="text" size="large" @click="$emit('cancel')">Cancel</v-btn>
      <v-btn
        variant="tonal"
        color="secondary"
        size="large"
        class="px-6 font-weight-bold"
        :loading="invoiceStore.loading"
        @click="save('Draft')"
      >
        Save as Draft
      </v-btn>
      <v-btn
        color="primary"
        variant="flat"
        size="large"
        class="px-8 font-weight-bold ml-2"
        :loading="invoiceStore.loading"
        @click="save('Sent')"
      >
        Save as Final
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue';
import { useInvoiceStore } from '~/stores/invoices';

const props = defineProps({
  invoice: Object, // for editing
  prefilledCustomerId: {
    type: [String, Number],
    default: null
  },
  prefilledServiceOrderId: {
    type: [String, Number],
    default: null
  }
});

const emit = defineEmits(['save', 'cancel']);

const invoiceStore = useInvoiceStore();
const customers = ref([]);
const serviceOrders = ref([]);
const serviceTypes = ref([]);
const loadingCustomers = ref(false);
const loadingServiceOrders = ref(false);
const loadingServiceTypes = ref(false);
const valid = ref(false);
const form = ref(null);

const isEdit = !!props.invoice;
const invoiceType = ref('service'); // 'service' or 'manual'

const state = reactive({
  customer_id: null,
  service_order_id: null,
  due_date: new Date().toISOString().substring(0, 10),
  notes: '',
  discount: 0,
  tax: 0,
  items: [
    { selectedItem: '', description: '', quantity: 1, unit_price: 0, cost_price: 0, total: 0 }
  ]
});

// Calculate Totals Reactively
const totals = computed(() => {
    const subtotal = state.items.reduce((acc, item) => {
        const qty = parseFloat(item.quantity) || 0;
        const price = parseFloat(item.unit_price) || 0;
        return acc + (qty * price);
    }, 0);
    
    const discount = parseFloat(state.discount) || 0;
    const tax = parseFloat(state.tax) || 0;
    const total = Math.max(0, subtotal - discount + tax);
    
    return { 
        subtotal: parseFloat(subtotal.toFixed(2)), 
        total: parseFloat(total.toFixed(2)) 
    };
});

// Auto-calculate VAT (5% of subtotal minus discount)
watch(() => totals.value.subtotal, (newSubtotal) => {
  if (!isEdit) {
    const discount = parseFloat(state.discount) || 0;
    state.tax = parseFloat(((newSubtotal - discount) * 0.05).toFixed(2));
  }
});

watch(() => state.discount, (newDiscount) => {
  if (!isEdit) {
    state.tax = parseFloat(((totals.value.subtotal - newDiscount) * 0.05).toFixed(2));
  }
});

// Handle tab switches
watch(invoiceType, (newType) => {
  if (isEdit) return;
  state.service_order_id = null;
  state.customer_id = props.prefilledCustomerId ? parseInt(props.prefilledCustomerId) : null;
  state.items = [
    { selectedItem: '', description: '', quantity: 1, unit_price: 0, cost_price: 0, total: 0 }
  ];
});

const fetchCustomers = async () => {
  loadingCustomers.value = true;
  try {
    const { $api } = useNuxtApp();
    const response = await $api.get('/customers', { params: { limit: 1000, is_active: 'true' } });
    if (response.data?.success) {
      customers.value = response.data.data;
    }
  } catch (err) {
    console.error('Failed to fetch customers', err);
  } finally {
    loadingCustomers.value = false;
  }
};

const fetchServiceOrders = async () => {
  loadingServiceOrders.value = true;
  try {
    const { $api } = useNuxtApp();
    const response = await $api.get('/services/orders', { params: { limit: 1000 } });
    if (response.data?.success) {
      // Filter active (Pending or InProgress) service orders
      let filtered = response.data.data.filter(
        o => o.status === 'Pending' || o.status === 'InProgress' || o.status === 'CompletedInvoicePending'
      );
      if (props.prefilledCustomerId) {
        filtered = filtered.filter(o => o.customer_id === parseInt(props.prefilledCustomerId));
      }
      serviceOrders.value = filtered;
    }
  } catch (err) {
    console.error('Failed to fetch service orders', err);
  } finally {
    loadingServiceOrders.value = false;
  }
};

const fetchServiceTypes = async () => {
  loadingServiceTypes.value = true;
  try {
    const { $api } = useNuxtApp();
    const response = await $api.get('/services/types', { params: { limit: 1000, is_active: 'true' } });
    if (response.data?.success) {
      serviceTypes.value = response.data.data;
    }
  } catch (err) {
    console.error('Failed to fetch service types', err);
  } finally {
    loadingServiceTypes.value = false;
  }
};

onMounted(() => {
  fetchCustomers();
  fetchServiceOrders();
  fetchServiceTypes();

  if (isEdit) {
      invoiceType.value = props.invoice.service_order_id ? 'service' : 'manual';
      Object.assign(state, {
          customer_id: props.invoice.customer_id,
          service_order_id: props.invoice.service_order_id,
          due_date: props.invoice.due_date,
          notes: props.invoice.notes || '',
          discount: parseFloat(props.invoice.discount) || 0,
          tax: parseFloat(props.invoice.tax) || 0,
          items: props.invoice.InvoiceItems.map(i => {
              const qty = parseFloat(i.quantity);
              const price = parseFloat(i.unit_price);
              return {
                  selectedItem: i.description,
                  description: i.description,
                  quantity: qty,
                  unit_price: price,
                  cost_price: parseFloat(i.cost_price || 0),
                  total: qty * price
              };
          })
      });
  } else if (props.prefilledServiceOrderId) {
      invoiceType.value = 'service';
      state.service_order_id = parseInt(props.prefilledServiceOrderId);
  } else if (props.prefilledCustomerId) {
      state.customer_id = parseInt(props.prefilledCustomerId);
  }
});

// Watch for serviceOrders load to prefill service order details if provided
watch(serviceOrders, (newOrders) => {
  if (props.prefilledServiceOrderId && newOrders.length > 0 && !state.customer_id) {
    onServiceOrderSelected(parseInt(props.prefilledServiceOrderId));
  }
}, { immediate: true });

const onServiceOrderSelected = (orderId) => {
  if (!orderId) return;
  const order = serviceOrders.value.find(o => o.id === orderId);
  if (!order) return;

  state.customer_id = order.customer_id;
  state.items = [
    {
      description: order.ServiceType?.name || '',
      quantity: 1,
      unit_price: parseFloat(order.ServiceType?.sell_price || 0),
      cost_price: parseFloat(order.ServiceType?.cost_price || 0),
      total: parseFloat(order.ServiceType?.sell_price || 0)
    }
  ];
};

const onItemCatalogSelected = (index, value) => {
  const item = state.items[index];
  if (typeof value === 'object' && value !== null) {
    item.description = value.name;
    item.unit_price = parseFloat(value.sell_price || 0);
    item.cost_price = parseFloat(value.cost_price || 0);
    item.total = item.quantity * item.unit_price;
  } else if (typeof value === 'string') {
    item.description = value;
  }
};

const addItem = () => {
    state.items.push({ selectedItem: '', description: '', quantity: 1, unit_price: 0, cost_price: 0, total: 0 });
};

const removeItem = (index) => {
    state.items.splice(index, 1);
};

const calculateRow = (index) => {
    const item = state.items[index];
    item.total = parseFloat(item.quantity || 0) * parseFloat(item.unit_price || 0);
};

const save = async (status) => {
    const { valid: isFormValid } = await form.value.validate();
    if (!isFormValid) return;

    try {
        state.status = status;
        
        // Final fallback: populate item description from combobox selection
        state.items.forEach(item => {
          if (item.selectedItem && typeof item.selectedItem === 'object') {
            item.description = item.selectedItem.name;
          } else if (item.selectedItem && typeof item.selectedItem === 'string') {
            item.description = item.selectedItem;
          }
        });

        let res;
        if (isEdit) {
            res = await invoiceStore.updateInvoice(props.invoice.id, state); 
        } else {
            res = await invoiceStore.createInvoice(state);
        }

        // Auto-download PDF for Final invoices
        if (status === 'Sent' && res && res.data) {
            try {
                await invoiceStore.downloadPDF(res.data.id, res.data.invoice_number);
            } catch (pdfErr) {
                console.error('PDF auto-download failed', pdfErr);
            }
        }
        
        emit('save');
    } catch (err) {
        alert(err.message || 'Operation failed');
    }
};
</script>

<style scoped>
.bg-surface-variant-light {
    background-color: #F8F9FA;
}
.item-row {
    transition: all 0.2s;
}
.item-row:hover {
    border-color: #0B57D0 !important;
    background-color: #FFFFFF;
}
</style>
