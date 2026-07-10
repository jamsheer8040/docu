<template>
  <v-form @submit.prevent="submitForm">
    <v-card>
      <v-card-title class="pa-6 d-flex align-center">
        <div class="text-h6 font-weight-bold">
          <v-icon icon="mdi-file-edit-outline" class="mr-2" color="primary"></v-icon>
          {{ isEdit ? 'Edit Document' : 'Add New Document' }}
        </div>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('cancel')"></v-btn>
      </v-card-title>

      <v-card-text class="pt-4">
        <!-- Customer Selection -->
        <v-autocomplete
          v-if="!isCustomerPortal || authStore.user?.LinkedCustomers?.length > 1"
          v-model="formData.customer_id"
          :items="isCustomerPortal ? authStore.user?.LinkedCustomers : customers"
          item-title="name"
          item-value="id"
          label="Customer *"
          placeholder="Search by name"
          :error-messages="v$.customer_id.$errors.map(e => e.$message)"
          @blur="v$.customer_id.$touch()"
          class="mb-2"
          :loading="loadingCustomers"
        ></v-autocomplete>

        <!-- Document Category -->
        <v-select
          v-model="selectedCategory"
          :items="categoryOptions"
          label="Document Category *"
          prepend-inner-icon="mdi-folder-outline"
          class="mb-2"
          variant="outlined"
          rounded="lg"
        ></v-select>

        <!-- Document Type (filtered by category) -->
        <v-select
          v-model="formData.document_type_id"
          :items="filteredDocumentTypes"
          item-title="name"
          item-value="id"
          label="Document Type *"
          :error-messages="v$.document_type_id.$errors.map(e => e.$message)"
          @blur="v$.document_type_id.$touch()"
          class="mb-2"
          :loading="loadingTypes"
          :disabled="!selectedCategory"
          :hint="filteredDocumentTypes.length === 0 && selectedCategory ? 'No document types found for this category' : ''"
          persistent-hint
        ></v-select>

        <!-- Document Number -->
        <v-text-field
          v-model="formData.doc_number"
          label="Document Number"
          :error-messages="v$.doc_number.$errors.map(e => e.$message)"
          @blur="v$.doc_number.$touch()"
          class="mb-2"
        ></v-text-field>

        <!-- Expiry Date -->
        <v-text-field
          v-model="formData.expiry_date"
          label="Expiry Date *"
          type="date"
          :error-messages="v$.expiry_date.$errors.map(e => e.$message)"
          @blur="v$.expiry_date.$touch()"
          class="mb-2"
          :hint="expiryHint"
          persistent-hint
        ></v-text-field>

        <!-- File Attachment -->
        <div class="mb-4">
          <div class="text-subtitle-2 mb-1 font-weight-bold d-flex align-center">
            <v-icon icon="mdi-paperclip" size="small" class="mr-2" color="primary"></v-icon>
            Document Attachment (PDF or Image)
          </div>
          <v-file-input
            v-model="file"
            label="Upload Document"
            variant="outlined"
            density="compact"
            prepend-icon=""
            prepend-inner-icon="mdi-upload"
            accept=".pdf,image/*"
            show-size
            clearable
            :hint="props.document?.file_path ? 'Existing file found. Upload new to replace.' : 'Max size: 10MB'"
            persistent-hint
            rounded="lg"
          >
            <template v-slot:append-inner v-if="props.document?.file_path">
              <v-tooltip text="View Current File" location="top">
                <template v-slot:activator="{ props: tooltipProps }">
                  <v-btn
                    v-bind="tooltipProps"
                    icon="mdi-eye-outline"
                    size="x-small"
                    variant="tonal"
                    color="primary"
                    :href="config.public.apiBase + props.document.file_path"
                    target="_blank"
                  ></v-btn>
                </template>
              </v-tooltip>
            </template>
          </v-file-input>
        </div>

        <!-- Staff Name Selection (only for Personal Documents) -->
        <v-combobox
          v-if="isPersonalDocument"
          v-model="formData.staff_name"
          :items="staffNames"
          label="Staff Name *"
          placeholder="Type to search or add new staff name"
          class="mb-2"
          :loading="loadingStaff"
          clearable
          variant="outlined"
          rounded="lg"
          :error-messages="staffNameErrors"
          @blur="v$.staff_name.$touch()"
          hint="Start typing to search. If name not found, type the full name and it will be saved for future use."
          persistent-hint
        ></v-combobox>

        <!-- Notes -->
        <v-textarea
          v-model="formData.notes"
          label="Notes / Remarks"
          :error-messages="v$.notes.$errors.map(e => e.$message)"
          @blur="v$.notes.$touch()"
          rows="3"
          variant="outlined"
          rounded="lg"
        ></v-textarea>
      </v-card-text>

      <v-card-actions class="pa-6 pt-0">
        <v-spacer></v-spacer>
        <v-btn variant="text" color="grey-darken-1" rounded="lg" @click="$emit('cancel')">Cancel</v-btn>
        <v-btn 
          type="submit" 
          color="primary" 
          variant="flat"
          class="px-8 font-weight-bold"
          rounded="lg"
          :loading="loading" 
          :disabled="!v$.$anyDirty && isEdit && !file"
        >
          {{ isEdit ? 'Save Changes' : 'Create Document' }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-form>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useVuelidate } from '@vuelidate/core';
import { required, maxLength, requiredIf } from '@vuelidate/validators';
import { useAuthStore } from '~/stores/auth';

const props = defineProps({
  document: {
    type: Object,
    default: null
  },
  loading: {
    type: Boolean,
    default: false
  },
  prefilledCustomerId: {
    type: [String, Number],
    default: null
  }
});

const emit = defineEmits(['save', 'cancel']);
const config = useRuntimeConfig();
const authStore = useAuthStore();
const isCustomerPortal = computed(() => authStore.user?.role_type === 'CustomerPortal');

const isEdit = computed(() => !!props.document);
const documentTypes = ref([]);
const customers = ref([]);
const loadingCustomers = ref(false);
const loadingTypes = ref(false);

const categoryOptions = ['Company Document', 'Personal Document'];
const selectedCategory = ref('Company Document');

const filteredDocumentTypes = computed(() => {
  if (!selectedCategory.value) return documentTypes.value;
  return documentTypes.value.filter(
    t => (t.category || 'Company Document') === selectedCategory.value
  );
});

// Reset document type selection when category changes
watch(selectedCategory, (newCat) => {
  // Only reset if the currently selected type doesn't belong to the new category
  if (formData.document_type_id) {
    const currentType = documentTypes.value.find(t => t.id === formData.document_type_id);
    if (currentType && (currentType.category || 'Company Document') !== newCat) {
      formData.document_type_id = null;
    }
  }
  // Clear staff name when switching away from Personal Document
  if (newCat !== 'Personal Document') {
    formData.staff_name = '';
  }
});
const file = ref(null);

const formData = reactive({
  customer_id: null,
  document_type_id: null,
  type: null, // Keep for legacy
  doc_number: '',
  expiry_date: '',
  staff_name: '',
  notes: ''
});

const isPersonalDocument = computed(() => selectedCategory.value === 'Personal Document');

const validationRules = computed(() => ({
  customer_id: { required },
  document_type_id: { required },
  doc_number: { maxLength: maxLength(100) },
  expiry_date: { required },
  staff_name: {
    ...(isPersonalDocument.value ? { required } : {})
  },
  notes: { maxLength: maxLength(500) }
}));

const v$ = useVuelidate(validationRules, formData);

const staffNameErrors = computed(() => {
  return v$.value.staff_name?.$errors?.map(e => e.$message) || [];
});

const expiryHint = computed(() => {
  if (!formData.expiry_date || v$.value.expiry_date.$invalid) return '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(formData.expiry_date);
  const diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  
  if (diff < 0) return `Alert: Expired ${Math.abs(diff)} days ago`;
  if (diff === 0) return 'Alert: Expires today!';
  return `Expires in ${diff} days`;
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
    console.error('Failed to fetch customers for document form', err);
  } finally {
    loadingCustomers.value = false;
  }
};

const fetchDocTypes = async () => {
  loadingTypes.value = true;
  try {
    const { $api } = useNuxtApp();
    const res = await $api.get('/document-types');
    if (res.data?.success) {
      documentTypes.value = res.data.data;
      
      // If editing and we have a legacy type but no document_type_id, try to auto-match
      if (props.document && !props.document.document_type_id && props.document.type) {
          const match = documentTypes.value.find(t => t.name.toLowerCase() === props.document.type.toLowerCase());
          if (match) {
            formData.document_type_id = match.id;
            selectedCategory.value = match.category || 'Company Document';
          }
      }
      
      // If editing, set the category based on the selected document type
      if (props.document && props.document.document_type_id) {
        const docType = documentTypes.value.find(t => t.id === props.document.document_type_id);
        if (docType) {
          selectedCategory.value = docType.category || 'Company Document';
        }
      }
    }
  } catch (err) {
    console.error('Failed to fetch doc types for document form', err);
    // Fallback if API fails
    documentTypes.value = [
      { id: 1, name: 'Visa' },
      { id: 2, name: 'Passport' },
      { id: 3, name: 'TradeLicense' },
      { id: 4, name: 'EmiratesID' }
    ];
  } finally {
    loadingTypes.value = false;
  }
};


const staffNames = ref([]);
const loadingStaff = ref(false);

const fetchStaffNames = async () => {
  if (!formData.customer_id) {
    staffNames.value = [];
    return;
  }
  loadingStaff.value = true;
  try {
    const { $api } = useNuxtApp();
    const res = await $api.get(`/documents/staff/names?customer_id=${formData.customer_id}`);
    if (res.data?.success) {
      staffNames.value = res.data.data;
    }
  } catch (err) {
    console.error('Failed to fetch staff names:', err);
  } finally {
    loadingStaff.value = false;
  }
};

watch(() => formData.customer_id, (newVal, oldVal) => {
  if (newVal) {
    fetchStaffNames();
  } else {
    staffNames.value = [];
  }
  if (oldVal && newVal !== oldVal && formData.staff_name) {
    // Optionally clear the staff name when switching customers if it's not an initial edit load
    formData.staff_name = '';
  }
}, { immediate: true });

onMounted(() => {
  if (isCustomerPortal.value) {
    if (Array.isArray(authStore.activeCustomerFilter) && authStore.activeCustomerFilter.length === 1) {
      formData.customer_id = parseInt(authStore.activeCustomerFilter[0]);
    } else if (authStore.user?.LinkedCustomers?.length === 1) {
      formData.customer_id = authStore.user.LinkedCustomers[0].id;
    }
  } else {
    fetchCustomers();
  }
  fetchDocTypes();
  if (props.document) {
    Object.assign(formData, {
      ...props.document,
      // Ensure dates are correctly formatted for input type="date"
      expiry_date: props.document.expiry_date ? props.document.expiry_date.split('T')[0] : '',
      staff_name: props.document.staff_name || ''
    });
  } else if (props.prefilledCustomerId) {
    formData.customer_id = parseInt(props.prefilledCustomerId);
  }
});

const submitForm = async () => {
  const isValid = await v$.value.$validate();
  if (!isValid) return;
  
  const data = new FormData();
  // Append all form fields
  Object.keys(formData).forEach(key => {
    if (formData[key] !== null && formData[key] !== undefined) {
      data.append(key, formData[key]);
    } else if (key === 'issue_date') {
        // Handle explicit null for date
        // Actually FormData sends strings, so 'null' string is bad. 
        // We just don't append it or append empty if backend handles it.
    }
  });

  if (file.value) {
      const fileToUpload = Array.isArray(file.value) ? file.value[0] : file.value;
      data.append('file', fileToUpload);
  }
  
  emit('save', data);
};
</script>
