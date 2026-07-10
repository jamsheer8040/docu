<template>
  <v-dialog v-model="show" max-width="600px" persistent>
    <v-card>
      <v-card-title class="pa-6 d-flex align-center">
        <div class="text-h6 font-weight-bold">
          <v-icon icon="mdi-account-edit-outline" class="mr-2" color="primary"></v-icon>
          {{ isEdit ? 'Edit Customer' : 'Add New Customer' }}
        </div>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" size="small" @click="close"></v-btn>
      </v-card-title>
      <v-card-text>
        <v-form @submit.prevent="submit">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="state.name"
                label="Full Name *"
                :error-messages="v$.name.$errors.map(e => e.$message)"
                @blur="v$.name.$touch"
                variant="outlined"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="state.email"
                label="Email"
                :error-messages="v$.email.$errors.map(e => e.$message)"
                @blur="v$.email.$touch"
                variant="outlined"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="state.phone_whatsapp"
                label="Phone / WhatsApp *"
                hint="Format: +971501234567"
                persistent-hint
                :error-messages="v$.phone_whatsapp.$errors.map(e => e.$message)"
                @blur="v$.phone_whatsapp.$touch"
                variant="outlined"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="state.trade_license_no"
                label="Trade License No"
                variant="outlined"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="state.city"
                label="City"
                variant="outlined"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="state.country"
                label="Country"
                variant="outlined"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="state.address"
                label="Address"
                rows="2"
                variant="outlined"
              ></v-textarea>
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="state.notes"
                label="Notes"
                rows="2"
                variant="outlined"
              ></v-textarea>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>
      <v-card-actions class="pa-6 pt-0">
        <v-spacer></v-spacer>
        <v-btn variant="text" color="grey-darken-1" @click="close">Cancel</v-btn>
        <v-btn
          color="primary"
          variant="flat"
          class="px-6"
          @click="submit"
          :loading="loading"
          :disabled="v$.$invalid"
        >
          {{ isEdit ? 'Update Customer' : 'Save Customer' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { useVuelidate } from '@vuelidate/core';
import { required, email, minLength, maxLength, helpers } from '@vuelidate/validators';

const props = defineProps({
  modelValue: Boolean,
  customer: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update:modelValue', 'saved']);

const show = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const isEdit = computed(() => !!props.customer);
const loading = ref(false);

const initialState = {
  name: '',
  email: '',
  phone_whatsapp: '',
  address: '',
  city: '',
  country: 'UAE',
  trade_license_no: '',
  notes: ''
};

const state = reactive({ ...initialState });

const rules = {
  name: { 
    required, 
    minLength: minLength(2), 
    maxLength: maxLength(150) 
  },
  email: { 
    email: helpers.withMessage('Invalid email format', email) 
  },
  phone_whatsapp: { 
    required: helpers.withMessage('Phone is required', required),
    regex: helpers.withMessage(
      'Format: +971501234567', 
      helpers.regex(/^\+?[1-9]\d{7,14}$/)
    )
  }
};

const v$ = useVuelidate(rules, state);

watch(() => props.customer, (newVal) => {
  if (newVal) {
    Object.assign(state, newVal);
  } else {
    Object.assign(state, initialState);
    v$.value.$reset();
  }
}, { immediate: true });

const close = () => {
  show.value = false;
};

const submit = async () => {
  const result = await v$.value.$validate();
  if (!result) return;

  loading.value = true;
  const { $api } = useNuxtApp();
  
  try {
    let response;
    if (isEdit.value) {
      response = await $api.put(`/customers/${props.customer.id}`, state);
    } else {
      response = await $api.post('/customers', state);
    }

    if (response.data.success) {
      emit('saved', response.data.data);
      close();
    }
  } catch (error) {
    console.error('Error saving customer:', error);
  } finally {
    loading.value = false;
  }
};
</script>
