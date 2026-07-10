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
              placeholder="e.g. 2 Year Partner Visa"
              :error-messages="v$.name.$errors.map(e => e.$message)"
              @blur="v$.name.$touch()"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="state.category"
              label="Category"
              placeholder="e.g. Visa"
            ></v-text-field>
          </v-col>
          
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="state.sell_price"
              label="Selling Price (AED) *"
              type="number"
              prefix="AED"
              :error-messages="v$.sell_price.$errors.map(e => e.$message)"
              @blur="v$.sell_price.$touch()"
            ></v-text-field>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              v-model.number="state.cost_price"
              label="Cost Price (AED) *"
              type="number"
              prefix="AED"
              :error-messages="v$.cost_price.$errors.map(e => e.$message)"
              @blur="v$.cost_price.$touch()"
              :hint="costHint"
              persistent-hint
            ></v-text-field>
          </v-col>

          <v-col cols="12">
            <v-textarea
              v-model="state.description"
              label="Description"
              rows="2"
            ></v-textarea>
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

      <!-- Profit Preview -->
      <v-alert
        v-if="state.sell_price > 0"
        :color="profitColor"
        variant="tonal"
        class="mt-4 rounded-lg"
        :icon="profitIcon"
      >
        <div class="d-flex justify-space-between align-center">
          <div>
            <div class="text-subtitle-2 opacity-70">Estimated Profit</div>
            <div class="text-h6 font-weight-bold">AED {{ profit }}</div>
          </div>
          <div class="text-right">
            <div class="text-subtitle-2 opacity-70">Margin</div>
            <div class="text-h6 font-weight-bold">{{ margin }}%</div>
          </div>
        </div>
      </v-alert>
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
import { reactive, computed } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { required, minValue, decimal } from '@vuelidate/validators';

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

const isEdit = computed(() => !!props.service);

const initialState = {
  name: '',
  category: '',
  sell_price: 0,
  cost_price: 0,
  description: '',
  is_active: true
};

const state = reactive({
  ...initialState,
  ...(props.service || {})
});

const rules = {
  name: { required },
  sell_price: { required, minValue: minValue(0.01) },
  cost_price: { required, minValue: minValue(0) }
};

const v$ = useVuelidate(rules, state);

const profit = computed(() => (state.sell_price - state.cost_price).toFixed(2));
const margin = computed(() => {
  if (!state.sell_price || state.sell_price === 0) return 0;
  return ((parseFloat(profit.value) / state.sell_price) * 100).toFixed(1);
});

const profitColor = computed(() => {
  const p = parseFloat(profit.value);
  if (p > 0) return 'success';
  if (p === 0) return 'warning';
  return 'error';
});

const profitIcon = computed(() => {
  const p = parseFloat(profit.value);
  if (p > 0) return 'mdi-trending-up';
  if (p === 0) return 'mdi-trending-neutral';
  return 'mdi-trending-down';
});

const costHint = computed(() => {
  if (state.cost_price >= state.sell_price && state.sell_price > 0) {
    return 'Warning: Cost equals or exceeds selling price';
  }
  return '';
});

const submit = async () => {
  const result = await v$.value.$validate();
  if (result) {
    emit('save', { ...state });
  }
};
</script>
