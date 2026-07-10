<template>
  <v-card>
    <v-card-title class="pa-6 d-flex align-center">
      <div class="text-h6 font-weight-bold">
        <v-icon :icon="order ? 'mdi-pencil' : 'mdi-clipboard-plus-outline'" class="mr-2" color="primary"></v-icon>
        {{ order ? 'Edit Service Order #' + order.id : 'Create New Service Order' }}
      </div>
      <v-spacer></v-spacer>
      <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('cancel')"></v-btn>
    </v-card-title>

    <v-card-text class="pt-0">
      <v-form @submit.prevent="submit">
        <!-- Customer Selection -->
        <v-autocomplete
          v-model="state.customer_id"
          :items="customers"
          item-title="name"
          item-value="id"
          label="Select Customer *"
          placeholder="Search by name"
          :loading="loadingCustomers"
          :error-messages="v$.customer_id.$errors.map(e => e.$message)"
          @blur="v$.customer_id.$touch()"
          class="mb-2"
        >
          <template v-slot:item="{ props, item }">
            <v-list-item v-bind="props" :subtitle="item.raw.phone_whatsapp"></v-list-item>
          </template>
        </v-autocomplete>

        <!-- Service Type Selection -->
        <v-select
          v-model="state.service_type_id"
          :items="serviceTypes"
          item-title="name"
          item-value="id"
          label="Select Service *"
          placeholder="Choose from catalog"
          :error-messages="v$.service_type_id.$errors.map(e => e.$message)"
          @blur="v$.service_type_id.$touch()"
          class="mb-2"
        >
          <template v-slot:item="{ props, item }">
            <v-list-item 
              v-bind="props" 
              :subtitle="'AED ' + item.raw.sell_price"
            ></v-list-item>
          </template>
        </v-select>

        <!-- Criticality Selection -->
        <v-select
          v-model="state.criticality"
          :items="['Normal', 'Moderate', 'Critical']"
          label="Criticality Level *"
          placeholder="Select Criticality"
          class="mb-2"
        >
          <template v-slot:item="{ props, item }">
            <v-list-item v-bind="props">
              <template v-slot:prepend>
                <v-icon
                  :color="item.value === 'Critical' ? 'error' : (item.value === 'Moderate' ? 'orange' : 'success')"
                  icon="mdi-circle"
                  size="small"
                  class="mr-2"
                ></v-icon>
              </template>
            </v-list-item>
          </template>
          <template v-slot:prepend-inner>
            <v-icon
              :color="state.criticality === 'Critical' ? 'error' : (state.criticality === 'Moderate' ? 'orange' : 'success')"
              icon="mdi-circle"
              size="small"
              class="mr-1"
            ></v-icon>
          </template>
        </v-select>

        <!-- Notes -->
        <v-textarea
          v-model="state.notes"
          label="Internal Notes / Assignee"
          rows="2"
          placeholder="Add details about this specific order..."
          :error-messages="v$.notes.$errors.map(e => e.$message)"
          @blur="v$.notes.$touch()"
        ></v-textarea>

        <!-- Profit Preview (Visual only) -->
        <v-fade-transition>
          <div v-if="selectedService" class="mt-4 pa-4 rounded-xl border border-dashed bg-surface-variant text-surface-on-variant">
            <div class="d-flex justify-space-between align-center">
              <div>
                <div class="text-caption opacity-70">Client Price</div>
                <div class="text-subtitle-1 font-weight-bold">AED {{ selectedService.sell_price }}</div>
              </div>
              <v-icon icon="mdi-arrow-right" size="small"></v-icon>
              <div class="text-right">
                <div class="text-caption opacity-70">Estimated Profit</div>
                <div class="text-subtitle-1 font-weight-bold text-success">
                  + AED {{ (selectedService.sell_price - selectedService.cost_price).toFixed(2) }}
                </div>
              </div>
            </div>
            <div class="text-caption mt-2 opacity-50">
              * Invoice (INV-{{ new Date().getFullYear() }}-XXXX) will be auto-generated in Draft status upon completion.
            </div>
          </div>
        </v-fade-transition>
      </v-form>
    </v-card-text>

    <v-card-actions class="pa-6 pt-0">
      <v-spacer></v-spacer>
      <v-btn variant="text" color="grey-darken-1" @click="$emit('cancel')">Cancel</v-btn>
      <v-btn
        color="primary"
        variant="flat"
        class="px-6"
        :loading="loading"
        @click="submit"
      >
        {{ order ? 'Save Changes' : 'Create Order' }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { reactive, computed, onMounted, ref } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { required, maxLength } from '@vuelidate/validators';

const props = defineProps({
  serviceTypes: {
    type: Array,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  },
  prefilledCustomerId: {
    type: [String, Number],
    default: null
  },
  order: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['save', 'cancel']);

const customers = ref([]);
const loadingCustomers = ref(false);

const state = reactive({
  customer_id: null,
  service_type_id: null,
  notes: '',
  criticality: 'Normal'
});

const rules = {
  customer_id: { required },
  service_type_id: { required },
  notes: { maxLength: maxLength(500) },
  criticality: { required }
};

const v$ = useVuelidate(rules, state);

const selectedService = computed(() => {
  if (!state.service_type_id) return null;
  return props.serviceTypes.find(s => s.id === state.service_type_id);
});

const fetchCustomers = async () => {
  loadingCustomers.value = true;
  try {
    const { $api } = useNuxtApp();
    const response = await $api.get('/customers?limit=1000&is_active=true');
    if (response.data?.success) {
      customers.value = response.data.data;
    }
  } catch (err) {
    console.error('Failed to fetch customers for service order', err);
  } finally {
    loadingCustomers.value = false;
  }
};

onMounted(() => {
  fetchCustomers();
  if (props.prefilledCustomerId) {
    state.customer_id = parseInt(props.prefilledCustomerId);
  }
  if (props.order) {
    state.customer_id = props.order.customer_id;
    state.service_type_id = props.order.service_type_id;
    state.notes = props.order.notes || '';
    state.criticality = props.order.criticality || 'Normal';
  }
});

const submit = async () => {
  const result = await v$.value.$validate();
  if (result) {
    emit('save', { ...state });
  }
};
</script>
