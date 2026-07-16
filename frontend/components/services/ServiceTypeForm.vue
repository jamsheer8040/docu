<template>
  <v-card>
    <v-card-title class="pa-6 d-flex align-center">
      <div class="text-h6 font-weight-bold">
        <v-icon icon="mdi-cog-outline" class="mr-2" color="primary"></v-icon>
        {{ isEdit ? 'Edit Service' : 'Add New Service' }}
      </div>
      <v-spacer></v-spacer>
      <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('cancel')"></v-btn>
    </v-card-title>

    <v-card-text class="pt-0">
      <v-form @submit.prevent="submit">
        <v-row>
          <v-col cols="12" md="8">
            <v-text-field
              v-model="state.name"
              label="Service Name *"
              variant="outlined"
              rounded="lg"
              placeholder="e.g. 2 Year Partner Visa"
              :error-messages="v$.name.$errors.map(e => e.$message)"
              @blur="v$.name.$touch()"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-combobox
              v-model="state.category"
              :items="existingCategories"
              label="Category"
              variant="outlined"
              rounded="lg"
              placeholder="e.g. Visa"
              chips
              closable-chips
            ></v-combobox>
          </v-col>
          
          <v-col cols="12">
            <v-textarea
              v-model="state.description"
              label="Description"
              variant="outlined"
              rounded="lg"
              rows="2"
            ></v-textarea>
          </v-col>

          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="state.cost_price"
              label="Cost Price (AED) *"
              variant="outlined"
              rounded="lg"
              type="number"
              prefix="AED"
              :error-messages="v$.cost_price.$errors.map(e => e.$message)"
              @blur="v$.cost_price.$touch(); calculatePricings('cost')"
              @input="calculatePricings('cost')"
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="6">
            <v-select
              v-model="state.pricing_mode"
              :items="['Single', 'Multi']"
              label="Pricing Mode *"
              variant="outlined"
              rounded="lg"
              @update:modelValue="onPricingModeChange"
            ></v-select>
          </v-col>

          <v-col cols="12">
            <div class="text-subtitle-1 font-weight-bold mb-3">Pricing Configuration</div>
            <v-alert color="info" variant="tonal" class="mb-4 text-body-2 pb-3">
              Enter either the <strong>Service Charge</strong> or the <strong>Total Selling Price</strong>. The system will auto-calculate the other based on the Cost Price.
            </v-alert>

            <!-- Dynamic Pricing Rows -->
            <v-row v-for="(pricing, index) in state.pricing" :key="pricing.pricing_type" class="align-center mb-2">
              <v-col cols="12" md="2" class="font-weight-bold">
                {{ pricing.pricing_type }}
              </v-col>
              <v-col cols="12" md="4">
                <v-text-field
                  v-model.number="pricing.service_charge"
                  label="Service Charge (AED)"
                  variant="outlined"
                  density="compact"
                  hide-details
                  type="number"
                  prefix="AED"
                  @input="calculatePricings('charge', index)"
                ></v-text-field>
              </v-col>
              <v-col cols="12" md="1" class="text-center font-weight-bold text-grey">OR</v-col>
              <v-col cols="12" md="5">
                <v-text-field
                  v-model.number="pricing.selling_price"
                  label="Total Selling Price (AED)"
                  variant="outlined"
                  density="compact"
                  hide-details
                  type="number"
                  prefix="AED"
                  @input="calculatePricings('selling', index)"
                ></v-text-field>
              </v-col>
            </v-row>
            <div v-if="v$.pricing.$error" class="text-error text-caption mt-2">
              Please ensure all selling prices are valid and >= cost price.
            </div>
          </v-col>

          <v-col cols="12">
            <v-switch
              v-model="state.is_active"
              label="Is Service Active?"
              color="primary"
              hide-details
            ></v-switch>
          </v-col>
        </v-row>
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
        {{ isEdit ? 'Update Service' : 'Save Service' }}
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { reactive, computed, watch } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { required, minValue, helpers } from '@vuelidate/validators';
import { useServiceStore } from '@/stores/services';

const props = defineProps({
  service: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['save', 'cancel']);

const serviceStore = useServiceStore();
const existingCategories = computed(() => {
  const categories = serviceStore.serviceTypes.map(s => s.category).filter(Boolean);
  return [...new Set(categories)].sort();
});

const isEdit = computed(() => !!props.service);

const getInitialPricing = (mode) => {
  if (mode === 'Single') {
    return [{ pricing_type: 'Single', service_charge: 0, selling_price: 0 }];
  } else {
    return [
      { pricing_type: 'Normal', service_charge: 0, selling_price: 0 },
      { pricing_type: 'Prime', service_charge: 0, selling_price: 0 },
      { pricing_type: 'Prime+', service_charge: 0, selling_price: 0 }
    ];
  }
};

const initialState = {
  name: '',
  category: '',
  cost_price: 0,
  pricing_mode: 'Single',
  pricing: getInitialPricing('Single'),
  description: '',
  is_active: true
};

const state = reactive(JSON.parse(JSON.stringify(initialState)));

watch(() => props.service, (newVal) => {
  if (newVal) {
    Object.assign(state, {
      ...newVal,
      pricing: newVal.ServiceTypePricings?.length > 0 
        ? JSON.parse(JSON.stringify(newVal.ServiceTypePricings)) 
        : getInitialPricing(newVal.pricing_mode || 'Single')
    });
  } else {
    Object.assign(state, JSON.parse(JSON.stringify(initialState)));
  }
}, { immediate: true });

const onPricingModeChange = (mode) => {
  state.pricing = getInitialPricing(mode);
  calculatePricings('cost');
};

const calculatePricings = (source, index = -1) => {
  const cost = parseFloat(state.cost_price) || 0;
  
  if (source === 'cost') {
    // If cost changes, recalculate selling_price based on existing service_charge
    state.pricing.forEach(p => {
      const charge = parseFloat(p.service_charge) || 0;
      p.selling_price = parseFloat((cost + charge).toFixed(2));
    });
  } else if (source === 'charge' && index >= 0) {
    const charge = parseFloat(state.pricing[index].service_charge) || 0;
    state.pricing[index].selling_price = parseFloat((cost + charge).toFixed(2));
  } else if (source === 'selling' && index >= 0) {
    const selling = parseFloat(state.pricing[index].selling_price) || 0;
    state.pricing[index].service_charge = parseFloat((selling - cost).toFixed(2));
  }
};

const pricingValidator = (value) => {
  if (!Array.isArray(value) || value.length === 0) return false;
  return value.every(p => p.selling_price >= (parseFloat(state.cost_price) || 0));
};

const rules = {
  name: { required },
  cost_price: { required, minValue: minValue(0) },
  pricing_mode: { required },
  pricing: { 
    required,
    validPricing: helpers.withMessage('Selling price must be >= Cost price', pricingValidator)
  }
};

const v$ = useVuelidate(rules, state);

const submit = async () => {
  const result = await v$.value.$validate();
  if (!result) return;
  emit('save', { ...state });
};
</script>
