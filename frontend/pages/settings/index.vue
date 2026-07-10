<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <v-row class="mb-4 align-center">
      <v-col cols="12" md="6">
        <h1 class="text-h4 font-weight-bold color-primary">
          <v-icon icon="mdi-cog-outline" class="mr-2" color="primary"></v-icon>
          System Settings
        </h1>
        <p class="text-subtitle-1 text-grey-darken-1">Manage users, roles, and global configurations</p>
      </v-col>
      <v-col cols="12" md="6" class="d-flex justify-md-end">
        <v-tabs v-model="activeTab" color="primary" align-tabs="end" class="settings-tabs">
          <v-tab value="services" prepend-icon="mdi-cog-box">Services</v-tab>
          <v-tab value="doc-types" prepend-icon="mdi-file-cog">Doc Types</v-tab>
          <v-tab value="users" prepend-icon="mdi-account-group">Users</v-tab>
          <v-tab value="roles" prepend-icon="mdi-shield-account">Roles</v-tab>
          <v-tab value="general" prepend-icon="mdi-tune">General</v-tab>
        </v-tabs>
      </v-col>
    </v-row>

    <!-- Main Content -->
    <v-window v-model="activeTab" class="mt-6">
      <!-- Service Catalog Management -->
      <v-window-item value="services">
        <v-card class="border" border>
          <v-data-table-server
            v-model:items-per-page="itemsPerPageCatalog"
            :headers="catalogHeaders"
            :items="serviceStore.serviceTypes"
            :items-length="serviceStore.totalServiceTypes"
            :loading="serviceStore.loading"
            @update:options="loadCatalog"
            hover
          >
            <template v-slot:top>
              <v-toolbar flat color="transparent" class="px-4">
                <v-toolbar-title class="font-weight-bold">Service Catalog (Settings)</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-text-field
                  v-model="searchCatalog"
                  label="Search services..."
                  prepend-inner-icon="mdi-magnify"
                  density="compact"
                  hide-details
                  style="max-width: 300px;"
                  variant="outlined"
                  rounded="lg"
                  class="bg-white mr-4"
                ></v-text-field>
                <v-btn
                  v-if="auth.can('services', 'write')"
                  color="primary"
                  prepend-icon="mdi-plus"
                  rounded="lg"
                  variant="flat"
                  @click="openTypeForm()"
                >
                  Add Service Type
                </v-btn>
              </v-toolbar>
            </template>

            <!-- Custom Profit Column -->
            <template v-slot:item.profit="{ item }">
              <span :class="parseFloat(item.sell_price - item.cost_price) >= 0 ? 'text-success' : 'text-error'" class="font-weight-bold">
                AED {{ (item.sell_price - item.cost_price).toFixed(2) }}
              </span>
            </template>
            
            <!-- Status Column -->
            <template v-slot:item.is_active="{ item }">
              <v-switch
                v-if="auth.can('services', 'write')"
                v-model="item.is_active"
                color="success"
                hide-details
                density="compact"
                @change="toggleTypeStatus(item)"
              ></v-switch>
              <v-chip v-else :color="item.is_active ? 'success' : 'grey'" size="x-small">{{ item.is_active ? 'Active' : 'Inactive' }}</v-chip>
            </template>

            <!-- Actions -->
            <template v-slot:item.actions="{ item }">
              <v-btn v-if="auth.can('services', 'write')" icon="mdi-pencil-outline" variant="text" size="small" color="primary" @click="openTypeForm(item)"></v-btn>
              <v-btn v-if="auth.can('services', 'delete')" icon="mdi-delete-outline" variant="text" size="small" color="error" @click="confirmDeleteType(item)"></v-btn>
            </template>
          </v-data-table-server>
        </v-card>
      </v-window-item>

      <!-- Document Types Management -->
      <v-window-item value="doc-types">
        <v-card class="border" border>
          <v-data-table
            :headers="docTypeHeaders"
            :items="documentTypes"
            :loading="loadingDocTypes"
            hover
          >
            <template v-slot:top>
              <v-toolbar flat color="transparent" class="px-4">
                <v-toolbar-title class="font-weight-bold">Document Types (Settings)</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn
                  v-if="auth.can('settings', 'write')"
                  color="primary"
                  prepend-icon="mdi-plus"
                  rounded="lg"
                  variant="flat"
                  @click="openDocTypeDialog"
                >
                  Add New Type
                </v-btn>
              </v-toolbar>
            </template>

            <template v-slot:item.actions="{ item }">
              <v-btn v-if="auth.can('settings', 'write')" icon="mdi-pencil-outline" variant="text" size="small" color="primary" @click="openDocTypeDialog(item)"></v-btn>
              <v-btn v-if="auth.can('settings', 'delete')" icon="mdi-delete-outline" variant="text" size="small" color="error" @click="confirmDeleteDocType(item)"></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>

      <!-- Users Management -->
      <v-window-item value="users">
        <v-card class="border" border>
          <v-data-table
            :headers="userHeaders"
            :items="users"
            :loading="loading"
            hover
          >
            <template v-slot:top>
              <v-toolbar flat color="transparent" class="px-4">
                <v-toolbar-title class="font-weight-bold">Staff Directory</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn
                  v-if="auth.can('settings', 'write')"
                  color="primary"
                  prepend-icon="mdi-account-plus"
                  rounded="lg"
                  variant="flat"
                  @click="openUserForm()"
                >
                  Create User
                </v-btn>
              </v-toolbar>
            </template>

            <template v-slot:item.Role="{ item }">
              <v-chip size="small" variant="tonal" color="primary" class="font-weight-bold">
                {{ item.Role?.name || 'No Role' }}
              </v-chip>
            </template>

            <template v-slot:item.is_active="{ item }">
               <v-chip :color="item.is_active ? 'success' : 'grey'" size="x-small" label class="text-uppercase font-weight-bold">
                  {{ item.is_active ? 'Active' : 'Inactive' }}
               </v-chip>
            </template>

            <template v-slot:item.Customer="{ item }">
               <span v-if="item.LinkedCustomers && item.LinkedCustomers.length > 0" class="font-weight-bold text-primary">
                 {{ item.LinkedCustomers.map(c => c.name).join(', ') }}
               </span>
               <span v-else class="text-caption text-grey">N/A (Internal)</span>
             </template>

            <template v-slot:item.actions="{ item }">
              <v-btn v-if="auth.can('settings', 'write')" icon="mdi-pencil" variant="text" size="small" color="primary" @click="openUserForm(item)"></v-btn>
              <v-btn v-if="auth.can('settings', 'delete') && item.Role?.name !== 'Admin'" icon="mdi-delete" variant="text" size="small" color="error" @click="confirmDeleteUser(item)"></v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-window-item>

      <!-- Roles & Permissions -->
      <v-window-item value="roles">
        <v-row>
           <v-col cols="12" md="4">
              <v-card class="border h-100" border>
                 <v-list lines="two">
                    <v-list-subheader class="font-weight-bold text-primary">AVAILABLE ROLES</v-list-subheader>
                    <v-list-item
                      v-for="role in roles"
                      :key="role.id"
                      :active="selectedRole?.id === role.id"
                      @click="selectRole(role)"
                      rounded="lg"
                      class="ma-2 border"
                    >
                      <template v-slot:prepend>
                        <v-avatar color="primary-light" size="40">
                          <v-icon icon="mdi-shield-check" color="primary"></v-icon>
                        </v-avatar>
                      </template>
                      <v-list-item-title class="font-weight-bold">{{ role.name }}</v-list-item-title>
                      <v-list-item-subtitle>{{ role.type === 'CustomerPortal' ? 'Customer Portal' : 'Internal' }} • {{ role.UserCount || 0 }} Users Assigned</v-list-item-subtitle>
                     <template v-slot:append>
                        <div class="d-flex align-center">
                           <v-btn
                             v-if="auth.can('settings', 'write') && role.name !== 'Admin' && role.name !== 'Staff'"
                             icon="mdi-pencil-outline"
                             variant="text"
                             size="small"
                             color="primary"
                             class="mr-1"
                             @click.stop="openRoleDialog(role)"
                           ></v-btn>
                           <v-btn
                             v-if="auth.can('settings', 'delete') && role.name !== 'Admin' && role.name !== 'Staff'"
                             icon="mdi-delete-outline"
                             variant="text"
                             size="small"
                             color="error"
                             :disabled="role.UserCount > 0"
                             @click.stop="confirmDeleteRole(role)"
                           ></v-btn>
                           <v-icon v-else icon="mdi-chevron-right" color="grey"></v-icon>
                        </div>
                     </template>
                    </v-list-item>
                    <v-divider></v-divider>
                    <div class="pa-4" v-if="auth.can('settings', 'write')">
                       <v-btn block color="primary" variant="outlined" prepend-icon="mdi-plus" rounded="lg" @click="openRoleDialog()">
                          Create New Role
                       </v-btn>
                    </div>
                 </v-list>
              </v-card>
           </v-col>

           <v-col cols="12" md="8">
              <v-card v-if="selectedRole" class="border" border>
                 <v-toolbar color="transparent" flat class="px-4">
                    <v-toolbar-title>
                       <span class="text-grey">Permissions for:</span>
                       <span class="font-weight-bold ml-2">{{ selectedRole.name }}</span>
                    </v-toolbar-title>
                    <v-spacer></v-spacer>
                    <v-btn v-if="auth.can('settings', 'write')" color="success" prepend-icon="mdi-content-save" rounded="lg" @click="saveRolePermissions">Save Changes</v-btn>
                 </v-toolbar>
                 
                 <v-divider></v-divider>
                 
                 <v-card-text class="pa-0">
                    <v-table hover>
                       <thead>
                          <tr class="bg-grey-lighten-4">
                             <th class="font-weight-bold text-uppercase">Module / Responsibility</th>
                             <th class="text-center font-weight-bold">CAN VIEW (READ)</th>
                             <th class="text-center font-weight-bold">CAN EDIT (WRITE)</th>
                             <th class="text-center font-weight-bold">CAN DELETE</th>
                          </tr>
                       </thead>
                       <tbody>
                          <tr v-for="module in filteredSystemModules" :key="module.id">
                             <td class="font-weight-bold py-4">
                                <v-icon :icon="module.icon" start color="primary" class="mr-2"></v-icon>
                                {{ module.name }}
                             </td>
                             <td class="text-center">
                                <v-switch
                                  v-if="selectedRole?.permissions?.[module.id]"
                                  v-model="selectedRole.permissions[module.id].read"
                                  color="success"
                                  hide-details
                                  inset
                                  density="compact"
                                  class="d-inline-flex"
                                ></v-switch>
                             </td>
                             <td class="text-center">
                                <v-switch
                                  v-if="selectedRole?.permissions?.[module.id]"
                                  v-model="selectedRole.permissions[module.id].write"
                                  color="primary"
                                  hide-details
                                  inset
                                  density="compact"
                                  class="d-inline-flex"
                                ></v-switch>
                             </td>
                             <td class="text-center">
                                <v-switch
                                  v-if="selectedRole?.permissions?.[module.id] && module.id !== 'dashboard' && module.id !== 'reports' && module.id !== 'wallet'"
                                  v-model="selectedRole.permissions[module.id].delete"
                                  color="error"
                                  hide-details
                                  inset
                                  density="compact"
                                  class="d-inline-flex"
                                ></v-switch>
                                <span v-else class="text-caption text-grey">N/A</span>
                             </td>
                          </tr>
                       </tbody>
                    </v-table>
                 </v-card-text>
              </v-card>
              <v-sheet v-else height="400" border class="rounded-xl d-flex flex-column align-center justify-center text-grey border">
                 <v-icon icon="mdi-shield-alert" size="64" class="mb-4"></v-icon>
                 <div class="text-h6">Select a role to manage responsibilities</div>
              </v-sheet>
           </v-col>
        </v-row>
      </v-window-item>

      <!-- General Settings -->
      <v-window-item value="general">
         <v-row>
            <v-col cols="12" md="8">
               <v-card class="border pa-6" border>
                  <div class="d-flex align-center mb-6">
                     <v-avatar color="primary" variant="tonal" size="48" class="mr-4">
                        <v-icon icon="mdi-tune"></v-icon>
                     </v-avatar>
                     <div>
                        <div class="text-h6 font-weight-bold">Global Configuration</div>
                        <div class="text-caption text-grey">Manage system-wide defaults and branding</div>
                     </div>
                  </div>
                  
                  <v-form v-model="configValid" @submit.prevent="saveConfigs">
                     <v-row>
                        <v-col cols="12" md="6">
                           <v-text-field
                             v-model="configs.business_name"
                             label="Business Name"
                             variant="outlined"
                             rounded="lg"
                             hint="Displayed on invoices and headers"
                             persistent-hint
                           ></v-text-field>
                        </v-col>
                        <v-col cols="12" md="6">
                           <v-text-field
                             v-model="configs.base_currency"
                             label="Base Currency"
                             variant="outlined"
                             rounded="lg"
                             hint="Default currency for new invoices"
                             persistent-hint
                           ></v-text-field>
                        </v-col>
                        <v-col cols="12" md="6">
                           <v-text-field
                             v-model="configs.contact_email"
                             label="Support Email"
                             variant="outlined"
                             rounded="lg"
                           ></v-text-field>
                        </v-col>
                     </v-row>
                     
                     <v-divider class="my-6"></v-divider>
                     
                     <div class="d-flex justify-end">
                        <v-btn
                          color="primary"
                          variant="flat"
                          rounded="lg"
                          class="px-8"
                          height="44"
                          type="submit"
                          :loading="savingConfigs"
                          v-if="auth.can('settings', 'write')"
                        >
                           Save Configuration
                        </v-btn>
                     </div>
                  </v-form>
               </v-card>
            </v-col>
            <v-col cols="12" md="4">
               <v-card class="border bg-blue-lighten-5 pa-6 rounded-2xl" border variant="flat">
                  <h4 class="text-subtitle-1 font-weight-bold mb-2">Pro Tip</h4>
                  <p class="text-body-2 opacity-70">
                     Changes to the **Business Name** will reflect immediately on all newly generated PDF invoices.
                  </p>
               </v-card>
            </v-col>
         </v-row>
      </v-window-item>
    </v-window>

    <!-- Dialog User -->
    <v-dialog v-model="userDialog" max-width="500">
       <v-card v-if="userDialog" class="rounded-xl pa-4">
          <v-card-title class="text-h5 font-weight-bold">
             {{ edittingUser ? 'Edit System User' : 'Register New User' }}
          </v-card-title>
          <v-card-text class="mt-4">
            <v-form ref="userForm" v-model="formValid">
              <v-text-field v-model="currentUser.name" label="Full Name" variant="outlined" rounded="lg" :rules="[v => !!v || 'Name is required']" class="mb-4"></v-text-field>
              <v-text-field v-model="currentUser.email" label="Email ID" variant="outlined" rounded="lg" :rules="[v => !!v || 'Email is required']" class="mb-4"></v-text-field>
              <v-text-field
                v-model="currentUser.password"
                :label="edittingUser ? 'New Password (Optional)' : 'Temporary Password'"
                variant="outlined"
                rounded="lg"
                type="password"
                :rules="edittingUser ? [] : [v => !!v || 'Password is required']"
                hint="Leave blank to keep the current password when editing."
                :persistent-hint="edittingUser"
                class="mb-4"
              ></v-text-field>
              <v-select
                v-model="currentUser.role_id"
                :items="roles"
                item-title="name"
                item-value="id"
                label="Assign Role"
                variant="outlined"
                rounded="lg"
                :rules="[v => !!v || 'Role assignment is required']"
                class="mb-4"
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props" :subtitle="item.raw.type === 'CustomerPortal' ? 'Customer Portal' : 'Internal Role'"></v-list-item>
                </template>
              </v-select>
              <v-autocomplete
                 v-if="isSelectedRoleCustomerPortal"
                 v-model="currentUser.customer_ids"
                 :items="customers"
                 item-title="name"
                 item-value="id"
                 label="Link Customer Profiles"
                 variant="outlined"
                 rounded="lg"
                 multiple
                 chips
                 closable-chips
                 :rules="[v => (v && v.length > 0) || 'At least one Linked Customer is required for Customer Portal user']"
                 class="mb-4"
               ></v-autocomplete>
              <v-switch v-model="currentUser.is_active" label="Account Active Status" color="success" inset></v-switch>
            </v-form>
          </v-card-text>
          <v-card-actions class="pb-4">
             <v-spacer></v-spacer>
             <v-btn variant="text" rounded="lg" @click="userDialog = false">Cancel</v-btn>
             <v-btn color="primary" variant="flat" rounded="lg" class="px-8" :loading="savingUser" @click="saveUser">
                Save Account
             </v-btn>
          </v-card-actions>
       </v-card>
    </v-dialog>

    <!-- Dialog Role -->
    <v-dialog v-model="roleDialog" max-width="400">
        <v-card v-if="roleDialog" class="rounded-xl pa-4">
           <v-card-title class="text-h5 font-weight-bold">
              {{ editingRole ? 'Edit System Role' : 'New System Role' }}
           </v-card-title>
           <v-card-text class="mt-4">
              <v-text-field
                v-model="newRoleName"
                label="Role Title (e.g. Accountant)"
                variant="outlined"
                rounded="lg"
                class="mb-4"
                @keyup.enter="saveRole"
              ></v-text-field>
              <v-select
                v-model="newRoleType"
                :items="[
                  { title: 'Internal Role', value: 'Internal' },
                  { title: 'Customer Portal', value: 'CustomerPortal' }
                ]"
                item-title="title"
                item-value="value"
                label="User Category"
                variant="outlined"
                rounded="lg"
                hide-details
              ></v-select>
           </v-card-text>
           <v-card-actions class="pb-4">
              <v-spacer></v-spacer>
              <v-btn variant="text" rounded="lg" @click="roleDialog = false">Cancel</v-btn>
              <v-btn color="primary" variant="flat" rounded="lg" class="px-8" @click="saveRole">
                 {{ editingRole ? 'Update Role' : 'Create Role' }}
              </v-btn>
           </v-card-actions>
        </v-card>
    </v-dialog>

    <!-- Dialog Service Type -->
    <v-dialog v-model="typeDialog" max-width="700px" persistent>
      <ServiceTypeForm
        v-if="typeDialog"
        :service="selectedType"
        :loading="serviceStore.loading"
        @save="saveServiceType"
        @cancel="typeDialog = false"
      />
    </v-dialog>

    <!-- Dialog Document Type -->
    <v-dialog v-model="docTypeDialog" max-width="400">
        <v-card class="rounded-xl pa-4">
           <v-card-title class="text-h5 font-weight-bold">{{ editingDocType ? 'Edit Document Type' : 'New Document Type' }}</v-card-title>
            <v-card-text class="mt-4">
              <v-text-field v-model="newDocTypeName" label="Type Name (e.g. Work Permit)" variant="outlined" rounded="lg" class="mb-4"></v-text-field>
              <v-select
                v-model="newDocTypeCategory"
                :items="['Company Document', 'Personal Document']"
                label="Document Category"
                variant="outlined"
                rounded="lg"
                hide-details
              ></v-select>
            </v-card-text>
           <v-card-actions class="pb-4">
              <v-spacer></v-spacer>
              <v-btn variant="text" rounded="lg" @click="docTypeDialog = false">Cancel</v-btn>
              <v-btn color="primary" variant="flat" rounded="lg" class="px-8" @click="saveDocType">
                 {{ editingDocType ? 'Update' : 'Create' }}
               </v-btn>
           </v-card-actions>
        </v-card>
    </v-dialog>

    <!-- Snackbar -->
    <v-snackbar v-model="snackbar" :color="snackbarColor" rounded="pill">
       {{ snackbarText }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useServiceStore } from '@/stores/services';
import ServiceTypeForm from '@/components/services/ServiceTypeForm.vue';

const { $api } = useNuxtApp();

const activeTab = ref('services');
const auth = useAuthStore();
const serviceStore = useServiceStore();
const loading = ref(false);
const users = ref([]);
const roles = ref([]);
const selectedRole = ref(null);

// Dialogs
const userDialog = ref(false);
const roleDialog = ref(false);
const savingUser = ref(false);
const edittingUser = ref(false);
const editingRole = ref(null);
const formValid = ref(false);
const userForm = ref(null);

const currentUser = ref({
  name: '',
  email: '',
  password: '',
  role_id: null,
  is_active: true
});

const newRoleName = ref('');
const newRoleType = ref('Internal');
const configValid = ref(false);
const savingConfigs = ref(false);

const configs = reactive({
    business_name: 'DocClear Management',
    base_currency: 'AED',
    contact_email: 'support@docclear.com',
    default_language: 'English'
});

// Service Catalog State
const searchCatalog = ref('');
const typeDialog = ref(false);
const selectedType = ref(null);
const itemsPerPageCatalog = ref(10);
const currentPageCatalog = ref(1);

const catalogHeaders = [
  { title: 'Service Name', key: 'name', sortable: true },
  { title: 'Category', key: 'category', sortable: true },
  { title: 'Sell Price (AED)', key: 'sell_price', align: 'end' },
  { title: 'Cost Price (AED)', key: 'cost_price', align: 'end' },
  { title: 'Profit', key: 'profit', align: 'end', sortable: false },
  { title: 'Status', key: 'is_active', align: 'center', sortable: false },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
];

const docTypeHeaders = [
  { title: 'Type Name', key: 'name', sortable: true },
  { title: 'Category', key: 'category', sortable: true },
  { title: 'Actions', key: 'actions', align: 'end', sortable: false },
];

const documentTypes = ref([]);
const loadingDocTypes = ref(false);
const docTypeDialog = ref(false);
const newDocTypeName = ref('');
const newDocTypeCategory = ref('Company Document');
const editingDocType = ref(null);

// UI Meta
const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');

const userHeaders = [
  { title: 'Full Name', key: 'name', sortable: true },
  { title: 'Email Address', key: 'email', sortable: true },
  { title: 'Assigned Role', key: 'Role', sortable: true },
  { title: 'Linked Customer', key: 'Customer', sortable: true },
  { title: 'Account Status', key: 'is_active', sortable: true, align: 'center' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
];

const systemModules = [
  { id: 'dashboard', name: 'dashboard', icon: 'mdi-view-dashboard' },
  { id: 'customers', name: 'customers', icon: 'mdi-account-group' },
  { id: 'documents', name: 'documents', icon: 'mdi-file-eye' },
  { id: 'services', name: 'services', icon: 'mdi-cog' },
  { id: 'invoices', name: 'invoices', icon: 'mdi-file-document-outline' },
  { id: 'expenses', name: 'expenses', icon: 'mdi-cash-remove' },
  { id: 'wallet', name: 'wallet', icon: 'mdi-wallet' },
  { id: 'reports', name: 'reports', icon: 'mdi-chart-line' },
  { id: 'settings', name: 'settings', icon: 'mdi-shield-lock' },
  { id: 'financials', name: 'financials', icon: 'mdi-currency-usd' }
];

const customers = ref([]);

const isSelectedRoleCustomerPortal = computed(() => {
  if (!currentUser.value.role_id) return false;
  const role = roles.value.find(r => r.id === currentUser.value.role_id);
  return role?.type === 'CustomerPortal';
});

const fetchCustomersForDropdown = async () => {
  try {
    const res = await $api.get('/customers?limit=1000&is_active=true');
    if (res.data.success) {
      customers.value = res.data.data;
    }
  } catch (err) {
    console.error('Failed to load customers:', err);
  }
};

const filteredSystemModules = computed(() => {
  if (selectedRole.value?.type === 'CustomerPortal') {
    return systemModules.filter(m => m.id === 'documents');
  }
  return systemModules;
});

// Fetch Data
const initSettings = async () => {
    loading.value = true;
    try {
        // 1. Fetch Users
        try {
            const uRes = await $api.get('/users');
            if (uRes.data.success) users.value = uRes.data.data;
        } catch (e) {
            console.error('[Settings] Users fetch failed:', e);
            showNotify('Could not load user list.', 'error');
        }

        // 2. Fetch Roles
        try {
            const rRes = await $api.get('/roles');
            if (rRes.data.success) {
                roles.value = rRes.data.data;
                // Auto-select Admin if available
                if (roles.value.length > 0 && !selectedRole.value) {
                    const adminRole = roles.value.find(r => r.name === 'Admin') || roles.value[0];
                    selectRole(adminRole);
                }
            }
        } catch (e) {
            console.error('[Settings] Roles fetch failed:', e);
            showNotify('Could not load role configurations.', 'error');
        }
        
        // 3. Fetch Configs (Non-blocking)
        try {
            const cRes = await $api.get('/config');
            if (cRes.data.success) {
                Object.assign(configs, cRes.data.data);
            }
        } catch (e) {
            console.warn('[Settings] Config fetch failed, using defaults:', e);
        }

        // 4. Fetch Document Types
        await fetchDocTypes();

        // 5. Fetch Customers
        await fetchCustomersForDropdown();
    } catch (err) {
        showNotify('General system error occurred while fetching settings.', 'error');
    } finally {
        loading.value = false;
    }
};

const openUserForm = (user = null) => {
    edittingUser.value = !!user;
    if (user) {
        currentUser.value = { 
            ...user, 
            password: '', 
            customer_ids: user.LinkedCustomers ? user.LinkedCustomers.map(c => c.id) : [] 
        };
    } else {
        currentUser.value = { name: '', email: '', password: '', role_id: roles.value[0]?.id, customer_ids: [], is_active: true };
    }
    userDialog.value = true;
};

const saveUser = async () => {
    if (!formValid.value) return;
    savingUser.value = true;
    try {
        if (edittingUser.value) {
            await $api.put(`/users/${currentUser.value.id}`, currentUser.value);
            showNotify('User account updated.', 'success');
        } else {
            await $api.post('/users', currentUser.value);
            showNotify('New user registered successfully.', 'success');
        }
        userDialog.value = false;
        initSettings();
    } catch (err) {
        showNotify(err.response?.data?.message || 'Error saving account.', 'error');
    } finally {
        savingUser.value = false;
    }
};

const confirmDeleteUser = async (user) => {
    if (confirm(`Delete user ${user.name}? This cannot be undone.`)) {
        try {
            await $api.delete(`/users/${user.id}`);
            showNotify('User removed from system.', 'success');
            initSettings();
        } catch (err) {
            showNotify('Failed to delete user.', 'error');
        }
    }
};

const openRoleDialog = (role = null) => {
    editingRole.value = role;
    newRoleName.value = role ? role.name : '';
    newRoleType.value = role ? role.type : 'Internal';
    roleDialog.value = true;
};

const saveRole = async () => {
    if (!newRoleName.value) return;
    try {
        if (editingRole.value) {
            await $api.put(`/roles/${editingRole.value.id}`, { 
                name: newRoleName.value,
                type: newRoleType.value
            });
            showNotify('Role renamed.', 'success');
        } else {
            await $api.post('/roles', { 
                name: newRoleName.value,
                type: newRoleType.value
            });
            showNotify('New role initialized.', 'success');
        }
        roleDialog.value = false;
        initSettings();
    } catch (err) {
        showNotify(err.response?.data?.message || 'Error saving role.', 'error');
    }
};

const confirmDeleteRole = async (role) => {
    if (role.UserCount > 0) {
        showNotify(`Cannot delete "${role.name}" because it has ${role.UserCount} assigned users.`, 'warning');
        return;
    }
    
    if (confirm(`Are you sure you want to delete the "${role.name}" role? This cannot be undone.`)) {
        try {
            await $api.delete(`/roles/${role.id}`);
            showNotify('Role removed.', 'success');
            initSettings();
        } catch (err) {
            showNotify(err.response?.data?.message || 'Failed to delete role.', 'error');
        }
    }
};

const selectRole = (role) => {
    try {
        // Double Ensure permissions object exists and is fresh
        const roleCopy = JSON.parse(JSON.stringify(role));
        
        // Safety: Parse string permissions if they come from the API as a string
        if (typeof roleCopy.permissions === 'string') {
            try {
                roleCopy.permissions = JSON.parse(roleCopy.permissions);
            } catch (e) {
                console.error('[Settings] Permission parse failed:', e);
                roleCopy.permissions = {};
            }
        }

        if (!roleCopy.permissions || typeof roleCopy.permissions !== 'object') {
            roleCopy.permissions = {};
        }

        systemModules.forEach(mod => {
            if (!roleCopy.permissions[mod.id] || typeof roleCopy.permissions[mod.id] !== 'object') {
                roleCopy.permissions[mod.id] = { read: false, write: false, delete: false };
            } else {
                // Sanitize existing permissions
                const p = roleCopy.permissions[mod.id];
                roleCopy.permissions[mod.id] = {
                    read: p.read === true,
                    write: p.write === true,
                    delete: p.delete === true
                };
            }
        });
        selectedRole.value = roleCopy;
    } catch (err) {
        console.error('[Settings] Role selection failed:', err);
    }
};

const saveRolePermissions = async () => {
    if (!selectedRole.value) return;
    try {
        await $api.put(`/roles/${selectedRole.value.id}`, {
            permissions: selectedRole.value.permissions
        });
        showNotify('Responsibilities updated successfully.', 'success');
        initSettings();
    } catch (err) {
        showNotify('Failed to save permissions.', 'error');
    }
};

const saveConfigs = async () => {
    savingConfigs.value = true;
    try {
        await $api.put('/config', configs);
        showNotify('System configuration updated.', 'success');
    } catch (err) {
        showNotify('Error saving configuration.', 'error');
    } finally {
        savingConfigs.value = false;
    }
};

const showNotify = (text, color) => {
    snackbarText.value = text;
    snackbarColor.value = color;
    snackbar.value = true;
};

// --- SERVICE CATALOG LOGIC ---

const loadCatalog = async ({ page, itemsPerPage: limit }) => {
    currentPageCatalog.value = page;
    itemsPerPageCatalog.value = limit;
    
    await serviceStore.fetchServiceTypes({
        page,
        limit,
        search: searchCatalog.value || undefined
    });
};

const openTypeForm = (type = null) => {
  selectedType.value = type;
  typeDialog.value = true;
};

const saveServiceType = async (data) => {
  try {
    if (selectedType.value) {
      await serviceStore.updateServiceType(selectedType.value.id, data);
      showNotify('Service updated successfully', 'success');
    } else {
      await serviceStore.createServiceType(data);
      showNotify('New service added to catalog', 'success');
    }
    typeDialog.value = false;
  } catch (err) {
    showNotify(err.message || 'Operation failed', 'error');
  }
};

const toggleTypeStatus = async (type) => {
    try {
        await serviceStore.updateServiceType(type.id, { is_active: type.is_active });
        showNotify(`Service ${type.is_active ? 'activated' : 'deactivated'}`, 'success');
    } catch (err) {
        showNotify(err.message || 'Failed to toggle status', 'error');
    }
};

const confirmDeleteType = async (type) => {
    if (confirm(`Are you sure you want to delete "${type.name}"?`)) {
        try {
            await serviceStore.deleteServiceType(type.id);
            showNotify('Service type deleted', 'success');
        } catch (err) {
            showNotify('Failed to delete service type', 'error');
        }
    }
};

let searchTimer;
watch(searchCatalog, (val) => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        loadCatalog({ page: 1, itemsPerPage: itemsPerPageCatalog.value });
    }, 400);
});

// --- DOCUMENT TYPES LOGIC ---

const fetchDocTypes = async () => {
    loadingDocTypes.value = true;
    try {
        const res = await $api.get('/document-types');
        if (res.data.success) documentTypes.value = res.data.data;
    } catch (e) {
        console.error('Failed to fetch doc types', e);
    } finally {
        loadingDocTypes.value = false;
    }
};

const openDocTypeDialog = (type = null) => {
    editingDocType.value = type;
    newDocTypeName.value = type ? type.name : '';
    newDocTypeCategory.value = type ? type.category : 'Company Document';
    docTypeDialog.value = true;
};

const saveDocType = async () => {
    if (!newDocTypeName.value) return;
    try {
        if (editingDocType.value) {
            await $api.put(`/document-types/${editingDocType.value.id}`, { 
                name: newDocTypeName.value,
                category: newDocTypeCategory.value
            });
            showNotify('Document type updated.', 'success');
        } else {
            await $api.post('/document-types', { 
                name: newDocTypeName.value,
                category: newDocTypeCategory.value
            });
            showNotify('Document type added.', 'success');
        }
        docTypeDialog.value = false;
        fetchDocTypes();
    } catch (err) {
        showNotify(err.response?.data?.message || 'Failed to save document type.', 'error');
    }
};

const confirmDeleteDocType = async (type) => {
    if (confirm(`Delete document type "${type.name}"? Existing documents with this type will keep their label but it won't be in the dropdown.`)) {
        try {
            await $api.delete(`/document-types/${type.id}`);
            showNotify('Document type removed.', 'success');
            fetchDocTypes();
        } catch (err) {
            showNotify('Failed to delete.', 'error');
        }
    }
};

onMounted(async () => {
    await initSettings();
    await auth.fetchMe();
});
</script>

<style scoped>
.settings-tabs :deep(.v-tab) {
    text-transform: none;
    font-weight: 700;
    letter-spacing: 0;
}

.border {
    border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)) !important;
}

.primary-light {
    background: rgba(var(--v-theme-primary), 0.1);
}
</style>
