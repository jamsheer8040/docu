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
          <div class="text-subtitle-1 font-weight-bold">Invoice Items (Internal View)</div>
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
            <v-col cols="12" md="3" v-if="invoiceType === 'manual'">
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
            <v-col cols="12" md="3" v-else>
              <v-text-field
                v-model="item.description"
                label="Description *"
                placeholder="Service Description"
                :rules="[v => !!v || 'Required']"
                hide-details="auto"
              ></v-text-field>
            </v-col>

            <v-col cols="12" md="1">
              <v-text-field
                v-model.number="item.quantity"
                label="Qty"
                type="number"
                min="1"
                hide-details="auto"
                @input="calculateRow(index)"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="2">
              <v-text-field
                v-model.number="item.cost_price"
                label="Cost (Govt Fee)"
                type="number"
                min="0"
                hide-details="auto"
                @input="calculateRow(index)"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="2">
              <v-text-field
                v-model.number="item.service_charge"
                label="Service Charge"
                type="number"
                min="0"
                hide-details="auto"
                @input="calculateRow(index)"
              ></v-text-field>
            </v-col>
            
            <v-col cols="12" md="2">
              <div class="text-right pt-4 px-2">
                 <div class="text-caption opacity-60">Selling Price</div>
                 <div class="font-weight-bold text-subtitle-1">AED {{ item.selling_price.toFixed(2) }}</div>
              </div>
            </v-col>
            <v-col cols="12" md="1" class="text-right" v-if="invoiceType === 'manual'">
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

          <!-- Second Row for VAT and Wallet Selection -->
          <v-row dense align="center" class="mt-2">
            <v-col cols="12" md="3">
              <v-autocomplete
                v-model="item.wallet_id"
                :items="wallets"
                item-title="name"
                item-value="id"
                label="Cost Payment Wallet"
                placeholder="Select wallet for cost deduction"
                variant="outlined"
                density="compact"
                hide-details="auto"
                :disabled="item.cost_price <= 0"
                :rules="item.cost_price > 0 ? [v => !!v || 'Required when cost > 0'] : []"
              ></v-autocomplete>
            </v-col>
            <v-col cols="12" md="2" v-if="configStore.isTaxEnabled">
              <v-select
                v-model="item.vat_percentage"
                :items="taxes"
                item-title="name"
                item-value="rate"
                label="VAT Rate"
                variant="outlined"
                density="compact"
                hide-details="auto"
                @update:model-value="calculateRow(index)"
              ></v-select>
            </v-col>
            <v-col cols="12" md="2" v-if="configStore.isTaxEnabled">
               <div class="pt-4 px-2">
                 <div class="text-caption opacity-60">VAT Amount</div>
                 <div class="font-weight-bold">AED {{ item.vat_amount.toFixed(2) }}</div>
              </div>
            </v-col>
            <v-spacer></v-spacer>
            <v-col cols="12" md="3">
               <div class="text-right pt-4 px-2 bg-primary-lighten-5 rounded pa-2">
                 <div class="text-caption opacity-80 text-primary">Item Grand Total</div>
                 <div class="font-weight-bold text-h6 text-primary">AED {{ item.total.toFixed(2) }}</div>
              </div>
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
              <span class="opacity-70">Total Selling Price (Subtotal)</span>
              <span class="font-weight-bold">AED {{ totals.subtotal.toFixed(2) }}</span>
            </div>
            
            <div class="d-flex justify-space-between align-center mb-4" v-if="configStore.isTaxEnabled">
              <span class="opacity-70">Total VAT</span>
              <span class="font-weight-bold">AED {{ totals.vat.toFixed(2) }}</span>
            </div>

            <div class="d-flex justify-space-between align-center mb-4">
              <span class="opacity-70">Total Cost (Internal)</span>
              <span class="font-weight-bold text-error">AED {{ totals.cost.toFixed(2) }}</span>
            </div>

            <div class="d-flex justify-space-between align-center mb-4">
              <span class="opacity-70">Total Profit (Internal)</span>
              <span class="font-weight-bold text-success">AED {{ (totals.subtotal - totals.cost).toFixed(2) }}</span>
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
        @click="save('Issued')"
      >
        Issue Invoice
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { reactive, ref, computed, onMounted, watch } from 'vue';
import { useInvoiceStore } from '~/stores/invoices';
import { useConfigStore } from '~/stores/config';

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
const configStore = useConfigStore();
const customers = ref([]);
const serviceOrders = ref([]);
const serviceTypes = ref([]);
const wallets = ref([]);
const taxes = ref([
  { name: 'VAT 5%', rate: 5 },
  { name: 'No VAT', rate: 0 }
]);

const loadingCustomers = ref(false);
const loadingServiceOrders = ref(false);
const loadingServiceTypes = ref(false);
const valid = ref(false);
const form = ref(null);

const isEdit = !!props.invoice;
const invoiceType = ref('service'); // 'service' or 'manual'

const getEmptyItem = () => ({ 
  selectedItem: '', 
  description: '', 
  quantity: 1, 
  cost_price: 0, 
  service_charge: 0, 
  selling_price: 0, 
  vat_percentage: 0, 
  vat_amount: 0, 
  total: 0,
  wallet_id: null
});

const state = reactive({
  customer_id: null,
  service_order_id: null,
  due_date: new Date().toISOString().substring(0, 10),
  notes: '',
  discount: 0, // Not heavily used in service invoices but kept for compatibility
  tax: 0, // Represents global tax if used, but we calculate based on items now
  items: [getEmptyItem()]
});

// Calculate main totals from items
const totals = computed(() => {
    let subtotal = 0;
    let cost = 0;
    let vat = 0;
    let total = 0;
    
    state.items.forEach(item => {
        subtotal += (item.selling_price * item.quantity);
        cost += (item.cost_price * item.quantity);
        vat += item.vat_amount;
        total += item.total;
    });
    
    return { 
        subtotal: parseFloat(subtotal.toFixed(2)), 
        cost: parseFloat(cost.toFixed(2)),
        vat: parseFloat(vat.toFixed(2)),
        total: parseFloat(total.toFixed(2)) 
    };
});

const calculateSellingPrice = (serviceType, customer) => {
  if (!serviceType) return 0;
  const cost = parseFloat(serviceType.cost_price) || 0;
  const pricings = serviceType.ServiceTypePricings || [];
  
  let targetPricing = null;
  if (serviceType.pricing_mode === 'Single') {
    targetPricing = pricings.find(p => p.pricing_type === 'Single');
  } else if (customer) {
    const category = customer.pricing_category || 'Normal';
    targetPricing = pricings.find(p => p.pricing_type === category);
  }
  
  if (!targetPricing && pricings.length > 0) targetPricing = pricings[0];
  
  return targetPricing ? parseFloat(targetPricing.selling_price) : cost;
};

// Handle tab switches
watch(invoiceType, (newType) => {
  if (isEdit) return;
  state.service_order_id = null;
  state.customer_id = props.prefilledCustomerId ? parseInt(props.prefilledCustomerId) : null;
  state.items = [getEmptyItem()];
});

const fetchData = async () => {
  const { $api } = useNuxtApp();
  
  // Fetch Customers
  loadingCustomers.value = true;
  $api.get('/customers', { params: { limit: 1000, is_active: 'true' } }).then(r => {
    if (r.data?.success) customers.value = r.data.data;
    loadingCustomers.value = false;
  }).catch(() => loadingCustomers.value = false);

  // Fetch Service Orders
  loadingServiceOrders.value = true;
  $api.get('/services/orders', { params: { limit: 1000 } }).then(r => {
    if (r.data?.success) {
      let filtered = r.data.data.filter(
        o => o.status === 'Pending' || o.status === 'InProgress' || o.status === 'CompletedInvoicePending'
      );
      if (props.prefilledCustomerId) {
        filtered = filtered.filter(o => o.customer_id === parseInt(props.prefilledCustomerId));
      }
      serviceOrders.value = filtered;
    }
    loadingServiceOrders.value = false;
  }).catch(() => loadingServiceOrders.value = false);

  // Fetch Service Types
  loadingServiceTypes.value = true;
  $api.get('/services/types', { params: { limit: 1000, is_active: 'true' } }).then(r => {
    if (r.data?.success) serviceTypes.value = r.data.data;
    loadingServiceTypes.value = false;
  }).catch(() => loadingServiceTypes.value = false);

  // Fetch Wallets
  $api.get('/wallet/accounts', { params: { limit: 100 } }).then(r => {
    if (r.data?.success) wallets.value = r.data.data;
  });

  // Fetch Taxes
  $api.get('/taxes').then(r => {
    if (r.data?.success && r.data.data.length > 0) taxes.value = r.data.data.map(t => ({ name: t.name, rate: parseFloat(t.rate) }));
  });
};

onMounted(() => {
  fetchData();

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
              return {
                  selectedItem: i.description,
                  description: i.description,
                  quantity: qty,
                  list_price: parseFloat(i.list_price || 0),
                  cost_price: parseFloat(i.cost_price || 0),
                  service_charge: parseFloat(i.service_charge || 0),
                  selling_price: parseFloat(i.selling_price || 0) || parseFloat(i.unit_price || 0),
                  vat_percentage: parseFloat(i.vat_percentage || 0),
                  vat_amount: parseFloat(i.vat_amount || 0),
                  total: parseFloat(i.total),
                  wallet_id: i.wallet_id
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

watch(serviceOrders, (newOrders) => {
  if (props.prefilledServiceOrderId && newOrders.length > 0 && !state.customer_id) {
    onServiceOrderSelected(parseInt(props.prefilledServiceOrderId));
  }
}, { immediate: true });

const onServiceOrderSelected = (orderId) => {
  if (!orderId) return;
  const order = serviceOrders.value.find(o => o.id === orderId);
  if (!order) return;

  const customer = customers.value.find(c => c.id === order.customer_id);
  const sellingPrice = calculateSellingPrice(order.ServiceType, customer);
  const costPrice = parseFloat(order.ServiceType?.cost_price || 0);
  const serviceCharge = sellingPrice > costPrice ? sellingPrice - costPrice : 0;

  state.customer_id = order.customer_id;
  
  const newItem = getEmptyItem();
  newItem.description = order.ServiceType?.name || '';
  newItem.cost_price = costPrice;
  newItem.service_charge = serviceCharge;
  newItem.selling_price = sellingPrice;
  
  state.items = [newItem];
  calculateRow(0);
};

const onItemCatalogSelected = (index, value) => {
  const item = state.items[index];
  if (typeof value === 'object' && value !== null) {
    const customer = customers.value.find(c => c.id === state.customer_id);
    const sellingPrice = calculateSellingPrice(value, customer);
    const costPrice = parseFloat(value.cost_price || 0);
    const serviceCharge = sellingPrice > costPrice ? sellingPrice - costPrice : 0;

    item.description = value.name;
    item.cost_price = costPrice;
    item.service_charge = serviceCharge;
    item.selling_price = sellingPrice;
    calculateRow(index);
  } else if (typeof value === 'string') {
    item.description = value;
  }
};

const addItem = () => {
    state.items.push(getEmptyItem());
};

const removeItem = (index) => {
    state.items.splice(index, 1);
};

const calculateRow = (index) => {
    const item = state.items[index];
    const cost = parseFloat(item.cost_price) || 0;
    const charge = parseFloat(item.service_charge) || 0;
    
    item.selling_price = cost + charge;
    
    const qty = parseFloat(item.quantity) || 1;
    const totalSelling = item.selling_price * qty;
    
    const vatRate = parseFloat(item.vat_percentage) || 0;
    item.vat_amount = parseFloat(((totalSelling * vatRate) / 100).toFixed(2));
    
    item.total = totalSelling + item.vat_amount;
};

const save = async (status) => {
    const { valid: isFormValid } = await form.value.validate();
    if (!isFormValid) return;

    try {
        let targetStatus = status;
        // Always save as Draft first to let backend properly trigger the 'Issued' deduction hook
        if (status === 'Issued') {
            state.status = 'Draft';
        } else {
            state.status = status;
        }
        
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

        // If target was Issued, now trigger the status transition
        if (targetStatus === 'Issued' && res && res.data) {
            await invoiceStore.updateStatus(res.data.id, 'Issued');
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
