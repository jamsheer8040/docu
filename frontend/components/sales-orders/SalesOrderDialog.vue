<template>
  <v-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)" max-width="1000" persistent>
    <v-card class="rounded-xl glass-card">
      <v-card-title class="pa-6 border-b d-flex align-center justify-space-between bg-surface">
        <span class="text-h5 font-weight-black text-primary">Create Sales Order</span>
        <v-btn icon="mdi-close" variant="text" @click="$emit('update:modelValue', false)"></v-btn>
      </v-card-title>

      <v-card-text class="pa-6">
        <v-form ref="form" v-model="valid">
          <h3 class="text-h6 font-weight-bold mb-4">Header Information</h3>
          <v-row>
            <v-col cols="12" md="6">
              <v-select
                v-model="formData.customer_id"
                :items="customers"
                item-title="name"
                item-value="id"
                label="Customer *"
                :rules="[v => !!v || 'Customer is required']"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                class="mb-2"
                bg-color="surface"
              ></v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.contact_person"
                label="Contact Person"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                class="mb-2"
                bg-color="surface"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.customer_reference"
                label="Customer Reference"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                class="mb-2"
                bg-color="surface"
              ></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="formData.branch"
                label="Branch"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                class="mb-2"
                bg-color="surface"
              ></v-text-field>
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="formData.internal_remarks"
                label="Internal Remarks"
                variant="outlined"
                density="comfortable"
                rounded="lg"
                rows="2"
                class="mb-2"
                bg-color="surface"
              ></v-textarea>
            </v-col>
          </v-row>

          <v-divider class="my-6"></v-divider>

          <div class="d-flex align-center justify-space-between mb-4">
            <h3 class="text-h6 font-weight-bold">Requested Services</h3>
            <v-btn color="primary" variant="tonal" size="small" prepend-icon="mdi-plus" @click="addServiceItem" rounded="lg">
              Add Service
            </v-btn>
          </div>

          <v-table class="bg-transparent border rounded-lg mb-4">
            <thead>
              <tr>
                <th>Service Type</th>
                <th>Description</th>
                <th>Qty</th>
                <th>Est. Price</th>
                <th>Priority</th>
                <th>Expected Time</th>
                <th width="50"></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in formData.items" :key="index">
                <td class="pa-2">
                  <v-autocomplete
                    v-model="item.service_type_id"
                    :items="serviceTypes"
                    item-title="name"
                    item-value="id"
                    placeholder="Select Service"
                    variant="outlined"
                    density="compact"
                    hide-details
                    @update:modelValue="(val) => onServiceTypeSelect(val, index)"
                  ></v-autocomplete>
                </td>
                <td class="pa-2">
                  <v-text-field
                    v-model="item.description"
                    placeholder="Notes..."
                    variant="outlined"
                    density="compact"
                    hide-details
                  ></v-text-field>
                </td>
                <td class="pa-2">
                  <v-text-field
                    v-model.number="item.quantity"
                    type="number"
                    variant="outlined"
                    density="compact"
                    hide-details
                    style="width: 80px"
                  ></v-text-field>
                </td>
                <td class="pa-2">
                  <v-text-field
                    v-model.number="item.estimated_price"
                    type="number"
                    prefix="AED"
                    variant="outlined"
                    density="compact"
                    hide-details
                    style="width: 120px"
                  ></v-text-field>
                </td>
                <td class="pa-2">
                  <v-select
                    v-model="item.priority"
                    :items="['Normal', 'Moderate', 'Critical']"
                    variant="outlined"
                    density="compact"
                    hide-details
                    style="width: 110px"
                  ></v-select>
                </td>
                <td class="pa-2">
                  <v-text-field
                    v-model="item.expected_processing_time"
                    placeholder="e.g. 2 Days"
                    variant="outlined"
                    density="compact"
                    hide-details
                    style="width: 110px"
                  ></v-text-field>
                </td>
                <td class="pa-2 text-center">
                  <v-btn icon="mdi-delete" variant="text" color="error" size="small" @click="removeServiceItem(index)"></v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
          <div v-if="formData.items.length === 0" class="text-center pa-4 text-secondary border rounded-lg bg-surface opacity-60">
            No services added yet. Click "Add Service" above.
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions class="pa-6 border-t bg-surface">
        <v-spacer></v-spacer>
        <v-btn variant="text" color="secondary" size="large" rounded="lg" @click="$emit('update:modelValue', false)" class="mr-2">Cancel</v-btn>
        <v-btn color="primary" size="large" rounded="lg" elevation="2" @click="save" :loading="saving" :disabled="!valid || formData.items.length === 0" class="px-6 font-weight-bold">
          Save Sales Order
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { useNuxtApp } from '#app'
import { useUIStore } from '~/stores/ui'

const uiStore = useUIStore()

const props = defineProps({
  modelValue: Boolean,
  customers: Array,
  serviceTypes: Array,
  initialCustomerId: {
    type: [Number, String],
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'saved'])
const { $api } = useNuxtApp()

const form = ref(null)
const valid = ref(false)
const saving = ref(false)

const defaultItem = () => ({
  service_type_id: null,
  service_name: '',
  description: '',
  quantity: 1,
  estimated_price: 0,
  priority: 'Normal',
  expected_processing_time: ''
})

const formData = reactive({
  customer_id: null,
  contact_person: '',
  customer_reference: '',
  branch: '',
  internal_remarks: '',
  items: []
})

watch(() => props.modelValue, (val) => {
  if (val) {
    formData.customer_id = props.initialCustomerId || null
    formData.contact_person = ''
    formData.customer_reference = ''
    formData.branch = ''
    formData.internal_remarks = ''
    formData.items = [defaultItem()]
    if (form.value) form.value.resetValidation()
  }
}, { immediate: true })

const addServiceItem = () => {
  formData.items.push(defaultItem())
}

const removeServiceItem = (index) => {
  formData.items.splice(index, 1)
}

const onServiceTypeSelect = (id, index) => {
  const st = props.serviceTypes.find(s => s.id === id)
  if (st) {
    formData.items[index].service_name = st.name
    formData.items[index].estimated_price = st.cost_price || 0
  }
}

const save = async () => {
  const { valid: isValid } = await form.value.validate()
  if (!isValid) return

  // Validate items
  for (let i = 0; i < formData.items.length; i++) {
    const item = formData.items[i]
    if (!item.service_type_id || !item.service_name) {
      uiStore.showError(`Please select a service type for item #${i + 1}`)
      return
    }
  }

  saving.value = true
  try {
    await $api.post('/sales-orders', formData)
    emit('saved')
    emit('update:modelValue', false)
  } catch (err) {
    console.error(err)
    uiStore.showError(err.response?.data?.message || 'Failed to save Sales Order')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.glass-card {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(20px);
}
</style>
