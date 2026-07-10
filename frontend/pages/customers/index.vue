<template>
  <v-container fluid class="pa-2 pa-sm-4 pa-md-6">
    <v-row class="mb-2">
      <v-col cols="12" md="8" class="py-1">
        <h1 class="text-h4 font-weight-bold mb-0">Customer Directory</h1>
        <p class="text-subtitle-2 text-grey-darken-1 mb-0">Manage your clients and their contact information.</p>
      </v-col>
      <v-col cols="12" md="4" class="d-flex align-center justify-md-end flex-wrap gap-3">
        <v-btn
          v-if="auth.can('customers', 'write')"
          color="primary"
          prepend-icon="mdi-plus"
          rounded="lg"
          elevation="2"
          height="44"
          class="px-6 font-weight-bold"
          @click="openCreateDialog"
        >
          Add New Customer
        </v-btn>
      </v-col>
    </v-row>

    <v-card class="rounded-lg">
      <v-card-title class="pa-4 d-flex align-center">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Search customers..."
          variant="outlined"
          density="compact"
          hide-details
          class="max-width-400"
          @update:model-value="onSearch"
        ></v-text-field>
        <v-spacer></v-spacer>
        <v-btn-toggle 
          v-model="statusFilter" 
          mandatory 
          density="comfortable" 
          class="ml-2 d-flex gap-2" 
          variant="text"
          @update:model-value="onSearch"
        >
          <v-btn 
            value="true" 
            rounded="lg" 
            :variant="statusFilter === 'true' ? 'flat' : 'outlined'" 
            color="primary"
            class="px-4 font-weight-bold text-caption border"
          >
            Active
          </v-btn>
          <v-btn 
            value="false" 
            rounded="lg" 
            :variant="statusFilter === 'false' ? 'flat' : 'outlined'" 
            color="primary"
            class="px-4 font-weight-bold text-caption border"
          >
            Inactive
          </v-btn>
        </v-btn-toggle>
      </v-card-title>

      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="customers"
        :items-length="totalItems"
        :loading="loading"
        @update:options="loadCustomers"
        class="elevation-0"
      >
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center">
            <v-avatar color="primary" size="32" class="mr-3">
              <span class="text-caption text-white">{{ item.name.charAt(0).toUpperCase() }}</span>
            </v-avatar>
            <div class="font-weight-bold clickable-name" @click="viewCustomer(item.id)">
              {{ item.name }}
            </div>
          </div>
        </template>

        <template v-slot:item.phone_whatsapp="{ item }">
          <div class="d-flex align-center">
            <span>{{ item.phone_whatsapp }}</span>
            <v-btn
              icon="mdi-whatsapp"
              variant="text"
              color="success"
              size="small"
              class="ml-1"
              @click.stop="openWhatsApp(item.phone_whatsapp, GENERAL_MSG)"
            ></v-btn>
          </div>
        </template>

        <template v-slot:item.is_active="{ item }">
          <v-chip
            :color="item.is_active ? 'success' : 'grey'"
            size="x-small"
            class="text-uppercase font-weight-bold"
          >
            {{ item.is_active ? 'Active' : 'Inactive' }}
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex justify-end">
            <v-btn
              icon="mdi-eye"
              variant="text"
              color="info"
              size="small"
              @click="viewCustomer(item.id)"
            ></v-btn>
            <v-btn
              v-if="auth.can('customers', 'write')"
              icon="mdi-pencil"
              variant="text"
              color="primary"
              size="small"
              @click="openEditDialog(item)"
            ></v-btn>
            <v-btn
              v-if="auth.can('customers', 'delete') && item.is_active"
              icon="mdi-delete"
              variant="text"
              color="error"
              size="small"
              @click="confirmDelete(item)"
            ></v-btn>
            <v-btn
              v-if="auth.can('customers', 'write') && !item.is_active"
              icon="mdi-account-reactivate"
              variant="text"
              color="success"
              size="small"
              title="Reactivate Customer"
              @click="reactivateCustomer(item)"
            ></v-btn>
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <CustomerForm
      v-model="dialog"
      :customer="editingCustomer"
      @saved="onSaved"
    />

    <v-dialog v-model="deleteDialog" max-width="400px">
      <v-card>
        <v-card-title class="text-h6">Deactivate Customer?</v-card-title>
        <v-card-text>
          Are you sure you want to deactivate <b>{{ itemToDelete?.name }}</b>?
          This will hide them from active lists.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" variant="flat" @click="doDelete">Deactivate</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3000">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { useWhatsApp } from '@/composables/useWhatsApp';
import CustomerForm from '@/components/customers/CustomerForm.vue';

import { useAuthStore } from '@/stores/auth';

const auth = useAuthStore();
const { openWhatsApp, GENERAL_MSG } = useWhatsApp();
const { $api } = useNuxtApp();
const router = useRouter();

const customers = ref([]);
const totalItems = ref(0);
const loading = ref(false);
const search = ref('');
const statusFilter = ref('true');
const itemsPerPage = ref(10);
const currentPage = ref(1);

const dialog = ref(false);
const editingCustomer = ref(null);
const deleteDialog = ref(false);
const itemToDelete = ref(null);

const snackbar = reactive({ show: false, text: '', color: '' });

const headers = [
  { title: 'Name', key: 'name', align: 'start' },
  { title: 'Email', key: 'email' },
  { title: 'WhatsApp', key: 'phone_whatsapp' },
  { title: 'City', key: 'city' },
  { title: 'Status', key: 'is_active', align: 'center' },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false }
];

const loadCustomers = async ({ page, itemsPerPage: limit }) => {
  loading.value = true;
  currentPage.value = page;
  try {
    const response = await $api.get('/customers', {
      params: {
        page,
        limit,
        search: search.value,
        is_active: statusFilter.value
      }
    });

    if (response.data.success) {
      customers.value = response.data.data;
      totalItems.value = response.data.meta.total;
    }
  } catch (error) {
    console.error('Error fetching customers:', error);
  } finally {
    loading.value = false;
  }
};

let searchTimer;
const onSearch = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    loadCustomers({ page: 1, itemsPerPage: itemsPerPage.value });
  }, 400);
};

const openCreateDialog = () => {
  editingCustomer.value = null;
  dialog.value = true;
};

const openEditDialog = (item) => {
  editingCustomer.value = { ...item };
  dialog.value = true;
};

const viewCustomer = (id) => {
  router.push(`/customers/${id}`);
};

const onSaved = () => {
  loadCustomers({ page: currentPage.value, itemsPerPage: itemsPerPage.value });
  snackbar.text = 'Customer saved successfully';
  snackbar.color = 'success';
  snackbar.show = true;
};

const confirmDelete = (item) => {
  itemToDelete.value = item;
  deleteDialog.value = true;
};

const doDelete = async () => {
  try {
    const response = await $api.delete(`/customers/${itemToDelete.value.id}`);
    if (response.data.success) {
      loadCustomers({ page: currentPage.value, itemsPerPage: itemsPerPage.value });
      snackbar.text = response.data.message;
      snackbar.color = 'success';
      snackbar.show = true;
    }
  } catch (error) {
    snackbar.text = error.response?.data?.message || 'Error deleting customer';
    snackbar.color = 'error';
    snackbar.show = true;
  } finally {
    deleteDialog.value = false;
  }
};

const reactivateCustomer = async (item) => {
  try {
    // We must spread the existing item data to satisfy backend express-validator 'required' fields (name, phone)
    const payload = { ...item, is_active: true };
    const response = await $api.put(`/customers/${item.id}`, payload);
    if (response.data.success) {
      loadCustomers({ page: currentPage.value, itemsPerPage: itemsPerPage.value });
      snackbar.text = 'Customer successfully reactivated!';
      snackbar.color = 'success';
      snackbar.show = true;
    }
  } catch (error) {
    snackbar.text = error.response?.data?.message || 'Error reactivating customer';
    snackbar.color = 'error';
    snackbar.show = true;
  }
};
</script>

<style scoped>
.max-width-400 {
  max-width: 400px;
}
.clickable-name {
  cursor: pointer;
  color: var(--v-theme-primary);
}
.clickable-name:hover {
  text-decoration: underline;
}
</style>
