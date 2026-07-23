<template>
  <v-container fluid class="saas-portal py-8 px-6">
    <!-- Welcome Header -->
    <div class="d-flex justify-space-between align-center mb-8">
      <div>
        <h1 class="text-h3 font-weight-black text-gradient mb-1">SaaS Portal</h1>
        <p class="text-subtitle-1 text-secondary font-weight-medium">Platform Administration & Subscriber Management</p>
      </div>
      <v-btn color="error" variant="outlined" prepend-icon="mdi-logout" @click="handleLogout" rounded="xl">
        Logout
      </v-btn>
    </div>

    <!-- Stats Row -->
    <v-row class="mb-8">
      <v-col cols="12" sm="6" md="3">
        <v-card class="glass-card pa-4 rounded-2xl border-light" variant="flat">
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-caption text-secondary font-weight-bold">Total Workspaces</span>
            <v-icon icon="mdi-domain" color="primary"></v-icon>
          </div>
          <h2 class="text-h5 font-weight-black">{{ stats.totalTenants || 0 }}</h2>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="glass-card pa-4 rounded-2xl border-light" variant="flat">
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-caption text-secondary font-weight-bold">New Registrations</span>
            <v-icon icon="mdi-new-box" color="info"></v-icon>
          </div>
          <h2 class="text-h5 font-weight-black text-info">{{ stats.newRegistrations || 0 }}</h2>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="glass-card pa-4 rounded-2xl border-light" variant="flat">
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-caption text-secondary font-weight-bold">Active Subscriptions</span>
            <v-icon icon="mdi-check-decagram" color="success"></v-icon>
          </div>
          <h2 class="text-h5 font-weight-black text-success">{{ stats.activeTenants || 0 }}</h2>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="glass-card pa-4 rounded-2xl border-light" variant="flat">
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-caption text-secondary font-weight-bold">Trial Users</span>
            <v-icon icon="mdi-account-clock" color="primary"></v-icon>
          </div>
          <h2 class="text-h5 font-weight-black text-primary">{{ stats.trialUsers || 0 }}</h2>
        </v-card>
      </v-col>
      
      <v-col cols="12" sm="6" md="3">
        <v-card class="glass-card pa-4 rounded-2xl border-light" variant="flat">
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-caption text-secondary font-weight-bold">Trial Expiring Soon</span>
            <v-icon icon="mdi-timer-sand" color="warning"></v-icon>
          </div>
          <h2 class="text-h5 font-weight-black text-warning">{{ stats.trialExpiringSoon || 0 }}</h2>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="glass-card pa-4 rounded-2xl border-light" variant="flat">
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-caption text-secondary font-weight-bold">Expired</span>
            <v-icon icon="mdi-alert-circle" color="error"></v-icon>
          </div>
          <h2 class="text-h5 font-weight-black text-error">{{ stats.expiredAccounts || 0 }}</h2>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="glass-card pa-4 rounded-2xl border-light" variant="flat">
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-caption text-secondary font-weight-bold">Suspended</span>
            <v-icon icon="mdi-cancel" color="error"></v-icon>
          </div>
          <h2 class="text-h5 font-weight-black text-error">{{ stats.suspendedAccounts || 0 }}</h2>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="glass-card pa-4 rounded-2xl border-light" variant="flat">
          <div class="d-flex align-center justify-space-between mb-2">
            <span class="text-caption text-secondary font-weight-bold">Monthly Recurring Rev</span>
            <v-icon icon="mdi-cash-multiple" color="success"></v-icon>
          </div>
          <h2 class="text-h5 font-weight-black text-success">AED {{ formatCurrency(stats.mrr || 0) }}</h2>
        </v-card>
      </v-col>
    </v-row>

    <!-- Tabs Container -->
    <v-card class="glass-card rounded-2xl border-light overflow-hidden" variant="flat">
      <v-tabs v-model="tab" color="primary" bg-color="transparent" class="px-4">
        <v-tab value="tenants" class="font-weight-bold"><v-icon class="mr-2">mdi-domain</v-icon>Workspaces</v-tab>
        <v-tab value="plans" class="font-weight-bold"><v-icon class="mr-2">mdi-card-bulleted-settings-outline</v-icon>Subscription Plans</v-tab>
        <v-tab value="billing" class="font-weight-bold"><v-icon class="mr-2">mdi-receipt-text-outline</v-icon>Billing Invoices</v-tab>
        <v-tab value="settings" class="font-weight-bold"><v-icon class="mr-2">mdi-cog</v-icon>Global Settings</v-tab>
        <v-tab value="promo_codes" class="font-weight-bold"><v-icon class="mr-2">mdi-tag</v-icon>Promo Codes</v-tab>
      </v-tabs>

      <v-divider class="opacity-10"></v-divider>

      <v-card-text class="pa-6">
        <v-window v-model="tab">
          
          <!-- Tenants Management -->
          <v-window-item value="tenants">
            <div class="d-flex justify-space-between align-center mb-6">
              <v-text-field
                v-model="tenantSearch"
                label="Search Workspaces"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                hide-details
                max-width="320"
                class="rounded-lg"
                @input="debouncedFetchTenants"
              ></v-text-field>
            </div>

            <v-data-table
              :headers="tenantHeaders"
              :items="tenants"
              :loading="loadingTenants"
              class="bg-transparent"
            >
              <template v-slot:item.Plan="{ item }">
                <v-chip size="small" color="primary" class="font-weight-bold">
                  {{ item.Plan ? item.Plan.name : 'None' }}
                </v-chip>
              </template>

              <template v-slot:item.status="{ item }">
                <v-chip
                  size="small"
                  :color="getStatusColor(item.status)"
                  class="font-weight-bold text-uppercase"
                >
                  {{ item.status }}
                </v-chip>
              </template>

              <template v-slot:item.stats="{ item }">
                <div class="text-caption text-secondary">
                  <div>Users: <strong>{{ item.userCount }}</strong></div>
                  <div>Customers: <strong>{{ item.customerCount }}</strong></div>
                </div>
              </template>

              <template v-slot:item.created_at="{ item }">
                {{ formatDate(item.created_at) }}
              </template>

              <template v-slot:item.start_date="{ item }">
                {{ item.subscription_starts_at ? formatDate(item.subscription_starts_at) : '—' }}
              </template>

              <template v-slot:item.expiry_date="{ item }">
                {{ item.subscription_ends_at ? formatDate(item.subscription_ends_at) : (item.trial_ends_at ? formatDate(item.trial_ends_at) : '—') }}
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn icon="mdi-pencil-outline" variant="text" size="small" color="primary" @click="openEditTenant(item)"></v-btn>
                <v-btn icon="mdi-calendar-plus" variant="text" size="small" color="success" @click="openExtendSubscription(item)" title="Extend Subscription"></v-btn>
                <v-btn icon="mdi-history" variant="text" size="small" color="info" @click="openHistory(item)"></v-btn>
              </template>
            </v-data-table>
          </v-window-item>

          <!-- Plans Management -->
          <v-window-item value="plans">
            <div class="d-flex justify-space-between align-center mb-6">
              <div class="text-h6 font-weight-bold">Configured Tiers</div>
              <v-btn color="primary" prepend-icon="mdi-plus" rounded="xl" @click="openCreatePlan">Create Plan</v-btn>
            </div>

            <v-data-table :headers="planHeaders" :items="plans" :loading="loadingPlans" class="bg-transparent">
              <template v-slot:item.price="{ item }">
                <div>AED {{ item.price_monthly }}<span class="text-caption text-secondary">/mo</span></div>
                <div class="text-caption text-secondary">AED {{ item.price_yearly }}/yr</div>
              </template>

              <template v-slot:item.limits="{ item }">
                <div class="text-caption">
                  <div>Users: <strong>{{ item.max_users === -1 ? 'Unlimited' : item.max_users }}</strong></div>
                  <div>Customers: <strong>{{ item.max_customers === -1 ? 'Unlimited' : item.max_customers }}</strong></div>
                  <div>Docs: <strong>{{ item.max_documents === -1 ? 'Unlimited' : item.max_documents }}</strong></div>
                  <div>Wallets: <strong>{{ item.max_wallet_accounts === -1 ? 'Unlimited' : item.max_wallet_accounts }}</strong></div>
                </div>
              </template>

              <template v-slot:item.is_active="{ item }">
                <v-chip size="small" :color="item.is_active ? 'success' : 'grey'" class="font-weight-bold">
                  {{ item.is_active ? 'Active' : 'Inactive' }}
                </v-chip>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn icon="mdi-pencil-outline" variant="text" size="small" color="primary" @click="openEditPlan(item)"></v-btn>
              </template>
            </v-data-table>
          </v-window-item>

          <!-- Tenant Invoices -->
          <v-window-item value="billing">
            <v-data-table :headers="invoiceHeaders" :items="invoices" :loading="loadingInvoices" class="bg-transparent">
              <template v-slot:item.amount="{ item }">
                <strong>AED {{ formatCurrency(item.amount) }}</strong>
              </template>

              <template v-slot:item.status="{ item }">
                <v-chip size="small" :color="item.status === 'paid' ? 'success' : 'warning'" class="font-weight-bold text-uppercase">
                  {{ item.status }}
                </v-chip>
              </template>

              <template v-slot:item.due_date="{ item }">
                {{ formatDate(item.due_date) }}
              </template>

              <template v-slot:item.paid_at="{ item }">
                {{ item.paid_at ? formatDate(item.paid_at) : '—' }}
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn
                  v-if="item.status === 'unpaid'"
                  variant="flat"
                  size="small"
                  color="success"
                  class="rounded-lg font-weight-bold"
                  @click="paySaaSInvoice(item.id)"
                >
                  Mark Paid
                </v-btn>
              </template>
            </v-data-table>
          </v-window-item>

          <!-- Global Settings -->
          <v-window-item value="settings">
            <v-card class="glass-card pa-6" variant="flat">
              <div class="text-h6 font-weight-bold mb-4">Application Settings</div>
              <v-form ref="settingsForm">
                <v-text-field v-model="globalSettings.app_name" label="Application Name" class="mb-4"></v-text-field>
                
                <v-file-input v-model="logoFile" label="Upload Application Logo" accept="image/*" prepend-icon="" prepend-inner-icon="mdi-camera" class="mb-2" hint="Select an image to upload as the new logo" persistent-hint></v-file-input>
                <div v-if="globalSettings.app_logo" class="mb-4 px-2">
                  <div class="text-caption text-secondary mb-1">Current Logo:</div>
                  <img :src="globalSettings.app_logo" alt="Current Logo" style="max-height: 60px; object-fit: contain;" />
                </div>
                
                <v-divider class="my-6"></v-divider>
                <div class="text-h6 font-weight-bold mb-4">SaaS Settings</div>
                <v-text-field v-model="globalSettings.saas_trial_days" label="Default Trial Duration (Days)" type="number" class="mb-4" placeholder="14"></v-text-field>
                <v-text-field v-model="globalSettings.saas_invoice_prefix" label="Invoice Prefix" class="mb-4" placeholder="SAAS-INV-"></v-text-field>
                <v-textarea v-model="globalSettings.saas_invoice_footer" label="Invoice Footer / Notes" class="mb-4" rows="3"></v-textarea>
                
                <v-btn color="primary" rounded="xl" @click="saveGlobalSettings" :loading="loadingSettings">Save Settings</v-btn>
              </v-form>
            </v-card>
          </v-window-item>

          <!-- Promo Codes -->
          <v-window-item value="promo_codes">
            <div class="d-flex justify-space-between align-center mb-6">
              <div class="text-h6 font-weight-bold">Promo Codes</div>
              <v-btn color="primary" prepend-icon="mdi-plus" rounded="xl" @click="openCreatePromoCode">Create Promo Code</v-btn>
            </div>
            <v-data-table :headers="promoCodeHeaders" :items="promoCodes" :loading="loadingPromoCodes" class="bg-transparent">
              <template v-slot:item.discount="{ item }">
                {{ item.discount_type === 'percentage' ? item.discount_value + '%' : 'AED ' + item.discount_value }}
              </template>
              <template v-slot:item.uses="{ item }">
                {{ item.current_uses }} / {{ item.max_uses || '∞' }}
              </template>
              <template v-slot:item.valid_until="{ item }">
                {{ item.valid_until ? formatDate(item.valid_until) : 'Never' }}
              </template>
              <template v-slot:item.is_active="{ item }">
                <v-chip size="small" :color="item.is_active ? 'success' : 'grey'" class="font-weight-bold">
                  {{ item.is_active ? 'Active' : 'Inactive' }}
                </v-chip>
              </template>
              <template v-slot:item.actions="{ item }">
                <v-btn icon="mdi-pencil-outline" variant="text" size="small" color="primary" @click="openEditPromoCode(item)"></v-btn>
              </template>
            </v-data-table>
          </v-window-item>

        </v-window>
      </v-card-text>
    </v-card>

    <!-- Tenant Edit Dialog -->
    <v-dialog v-model="tenantDialog.show" max-width="540" persistent>
      <v-card class="rounded-2xl pa-4">
        <v-card-title class="font-weight-black text-h5 mb-4">Edit Workspace Subscription</v-card-title>
        <v-card-text>
          <v-form ref="tenantForm">
            <v-select
              v-model="tenantDialog.data.plan_id"
              :items="plans"
              item-title="name"
              item-value="id"
              label="Subscription Plan"
              class="mb-4"
            ></v-select>

            <v-select
              v-model="tenantDialog.data.status"
              :items="['new_registration', 'trial', 'active', 'suspended', 'expired', 'trial_expired', 'cancelled']"
              label="Account Status"
              class="mb-4"
            ></v-select>

            <v-select
              v-model="tenantDialog.data.billing_cycle"
              :items="['monthly', 'yearly']"
              label="Billing Cycle"
              class="mb-4"
            ></v-select>

            <template v-if="tenantDialog.data.status === 'trial'">
              <v-text-field
                v-model="tenantDialog.data.trial_ends_at"
                label="Trial Expiration Date (Manual Override)"
                type="date"
                class="mb-4"
                hint="Default is 14 days from activation."
                persistent-hint
              ></v-text-field>
            </template>

            <template v-if="tenantDialog.data.status === 'active'">
              <v-alert type="info" variant="tonal" class="mb-4">
                Subscription dates will be automatically calculated starting from today based on the selected billing cycle.
              </v-alert>
            </template>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="tenantDialog.show = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" class="px-6 rounded-lg" @click="saveTenantChanges">Save Changes</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- History Dialog -->
    <v-dialog v-model="historyDialog.show" max-width="700">
      <v-card class="rounded-2xl pa-4">
        <v-card-title class="font-weight-black text-h5 mb-4">Subscription History</v-card-title>
        <v-card-text>
          <v-data-table
            :headers="historyHeaders"
            :items="historyDialog.items"
            :loading="historyDialog.loading"
            class="bg-transparent"
            hide-default-footer
            :items-per-page="-1"
          >
            <template v-slot:item.created_at="{ item }">
              {{ formatDate(item.created_at) }}
            </template>
            <template v-slot:item.Plan="{ item }">
              {{ item.Plan ? item.Plan.name : '—' }}
            </template>
          </v-data-table>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="text" @click="historyDialog.show = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Plan Dialog -->
    <v-dialog v-model="planDialog.show" max-width="600" persistent>
      <v-card class="rounded-2xl pa-4">
        <v-card-title class="font-weight-black text-h5 mb-4">
          {{ planDialog.isEdit ? 'Edit Plan Config' : 'Create Subscription Plan' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="planForm">
            <v-text-field v-model="planDialog.data.name" label="Plan Name" class="mb-4"></v-text-field>
            
            <v-row>
              <v-col cols="6">
                <v-text-field v-model.number="planDialog.data.price_monthly" label="Monthly Price (AED)" type="number" class="mb-4"></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field v-model.number="planDialog.data.price_yearly" label="Yearly Price (AED)" type="number" class="mb-4"></v-text-field>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="6">
                <v-text-field v-model.number="planDialog.data.max_users" label="Max Users" hint="-1 for unlimited" persistent-hint type="number" class="mb-4"></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field v-model.number="planDialog.data.max_customers" label="Max Customers" hint="-1 for unlimited" persistent-hint type="number" class="mb-4"></v-text-field>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="6">
                <v-text-field v-model.number="planDialog.data.max_documents" label="Max Expiring Documents" hint="-1 for unlimited" persistent-hint type="number" class="mb-4"></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field v-model.number="planDialog.data.max_wallet_accounts" label="Max Wallet/Bank Accounts" hint="-1 for unlimited" persistent-hint type="number" class="mb-4"></v-text-field>
              </v-col>
            </v-row>

            <v-checkbox v-model="planDialog.data.is_active" label="Plan Active & Selectable" color="primary"></v-checkbox>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="planDialog.show = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" class="px-6 rounded-lg" @click="savePlanChanges">Save Plan</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Promo Code Dialog -->
    <v-dialog v-model="promoCodeDialog.show" max-width="500" persistent>
      <v-card class="rounded-2xl pa-4">
        <v-card-title class="font-weight-black text-h5 mb-4">
          {{ promoCodeDialog.isEdit ? 'Edit Promo Code' : 'Create Promo Code' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="promoCodeForm">
            <v-text-field v-model="promoCodeDialog.data.code" label="Code (e.g., SUMMER50)" class="mb-4" :disabled="promoCodeDialog.isEdit"></v-text-field>
            
            <v-row>
              <v-col cols="6">
                <v-select v-model="promoCodeDialog.data.discount_type" :items="['percentage', 'fixed']" label="Discount Type" class="mb-4"></v-select>
              </v-col>
              <v-col cols="6">
                <v-text-field v-model.number="promoCodeDialog.data.discount_value" label="Value" type="number" class="mb-4"></v-text-field>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="6">
                <v-text-field v-model="promoCodeDialog.data.valid_from" label="Valid From" type="date" class="mb-4"></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-text-field v-model="promoCodeDialog.data.valid_until" label="Valid Until" type="date" class="mb-4"></v-text-field>
              </v-col>
            </v-row>

            <v-text-field v-model.number="promoCodeDialog.data.max_uses" label="Maximum Uses" type="number" hint="Leave blank for unlimited" persistent-hint class="mb-4"></v-text-field>

            <v-checkbox v-model="promoCodeDialog.data.is_active" label="Is Active" color="primary"></v-checkbox>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="promoCodeDialog.show = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" class="px-6 rounded-lg" @click="savePromoCode">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Extend Subscription Dialog -->
    <v-dialog v-model="extendDialog.show" max-width="400" persistent>
      <v-card class="rounded-2xl pa-4">
        <v-card-title class="font-weight-black text-h5 mb-4">Extend Subscription</v-card-title>
        <v-card-text>
          <v-form ref="extendForm">
            <v-select
              v-model="extendDialog.data.extension_type"
              :items="[{title: '+1 Month', value: 'month'}, {title: '+1 Year', value: 'year'}, {title: 'Custom Date', value: 'custom'}]"
              label="Extension Amount"
              class="mb-4"
            ></v-select>
            
            <v-text-field
              v-if="extendDialog.data.extension_type === 'custom'"
              v-model="extendDialog.data.custom_date"
              label="Custom End Date"
              type="date"
              class="mb-4"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="extendDialog.show = false">Cancel</v-btn>
          <v-btn color="success" variant="flat" class="px-6 rounded-lg" @click="saveExtendSubscription" :loading="extendDialog.loading">Extend</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="toast.show" :color="toast.color" rounded="pill" location="top center">
      {{ toast.text }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
import dayjs from 'dayjs';

definePageMeta({
  middleware: ['auth-developer'],
  layout: false // Exclude standard tenant sidebar layout
});

const auth = useAuthStore();
const { $api } = useNuxtApp();

const tab = ref('tenants');
const stats = ref({});
const tenants = ref([]);
const plans = ref([]);
const invoices = ref([]);
const promoCodes = ref([]);
const globalSettings = ref({
  app_name: '',
  app_logo: '',
  saas_trial_days: 14,
  saas_invoice_prefix: '',
  saas_invoice_footer: ''
});

const logoFile = ref(null);

const loadingTenants = ref(false);
const loadingPlans = ref(false);
const loadingInvoices = ref(false);
const loadingPromoCodes = ref(false);
const loadingSettings = ref(false);
const tenantSearch = ref('');

const toast = reactive({
  show: false,
  text: '',
  color: 'success'
});

const tenantHeaders = [
  { title: 'Company', key: 'name' },
  { title: 'Admin Email', key: 'email' },
  { title: 'Registered Date', key: 'created_at' },
  { title: 'Status', key: 'status' },
  { title: 'Package', key: 'Plan' },
  { title: 'Start Date', key: 'start_date' },
  { title: 'Expiry Date', key: 'expiry_date' },
  { title: 'Actions', key: 'actions', sortable: false }
];

const planHeaders = [
  { title: 'Plan Name', key: 'name' },
  { title: 'Pricing', key: 'price' },
  { title: 'Subscription Limits', key: 'limits' },
  { title: 'Active', key: 'is_active' },
  { title: 'Actions', key: 'actions', sortable: false }
];

const invoiceHeaders = [
  { title: 'Invoice Number', key: 'invoice_number' },
  { title: 'Workspace', key: 'Tenant.name' },
  { title: 'Amount', key: 'amount' },
  { title: 'Status', key: 'status' },
  { title: 'Due Date', key: 'due_date' },
  { title: 'Paid At', key: 'paid_at' },
  { title: 'Actions', key: 'actions', sortable: false }
];

const promoCodeHeaders = [
  { title: 'Code', key: 'code' },
  { title: 'Discount', key: 'discount' },
  { title: 'Uses', key: 'uses' },
  { title: 'Valid Until', key: 'valid_until' },
  { title: 'Active', key: 'is_active' },
  { title: 'Actions', key: 'actions', sortable: false }
];

const tenantDialog = reactive({
  show: false,
  data: {}
});

const extendDialog = reactive({
  show: false,
  loading: false,
  data: {
    tenant_id: null,
    extension_type: 'month',
    custom_date: ''
  }
});

const planDialog = reactive({
  show: false,
  isEdit: false,
  data: {}
});

const promoCodeDialog = reactive({
  show: false,
  isEdit: false,
  data: {}
});

const historyDialog = reactive({
  show: false,
  loading: false,
  items: []
});

const historyHeaders = [
  { title: 'Date', key: 'created_at' },
  { title: 'Action', key: 'action' },
  { title: 'Old Status', key: 'old_status' },
  { title: 'New Status', key: 'new_status' },
  { title: 'Package', key: 'Plan' }
];

onMounted(async () => {
  await fetchStats();
  await fetchTenants();
  await fetchPlans();
  await fetchInvoices();
  await fetchSettings();
  await fetchPromoCodes();
});

const fetchStats = async () => {
  try {
    const res = await $api.get('/saas/stats');
    if (res.data.success) stats.value = res.data.data;
  } catch (err) {
    showToast('Error loading stats', 'error');
  }
};

const fetchTenants = async () => {
  loadingTenants.value = true;
  try {
    const res = await $api.get(`/saas/tenants?search=${tenantSearch.value}`);
    if (res.data.success) tenants.value = res.data.data.tenants;
  } catch (err) {
    showToast('Error loading workspaces', 'error');
  } finally {
    loadingTenants.value = false;
  }
};

let debounceTimer;
const debouncedFetchTenants = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(fetchTenants, 300);
};

const fetchPlans = async () => {
  loadingPlans.value = true;
  try {
    const res = await $api.get('/saas/plans');
    if (res.data.success) plans.value = res.data.data;
  } catch (err) {
    showToast('Error loading plans', 'error');
  } finally {
    loadingPlans.value = false;
  }
};

const fetchInvoices = async () => {
  loadingInvoices.value = true;
  try {
    const res = await $api.get('/saas/invoices');
    if (res.data.success) invoices.value = res.data.data;
  } catch (err) {
    showToast('Error loading billing invoices', 'error');
  } finally {
    loadingInvoices.value = false;
  }
};

const fetchSettings = async () => {
  try {
    const res = await $api.get('/saas/settings');
    if (res.data.success) {
      globalSettings.value = { ...globalSettings.value, ...res.data.data };
    }
  } catch (err) {
    showToast('Error loading global settings', 'error');
  }
};

const fetchPromoCodes = async () => {
  loadingPromoCodes.value = true;
  try {
    const res = await $api.get('/saas/promo-codes');
    if (res.data.success) promoCodes.value = res.data.data;
  } catch (err) {
    showToast('Error loading promo codes', 'error');
  } finally {
    loadingPromoCodes.value = false;
  }
};

const saveGlobalSettings = async () => {
  loadingSettings.value = true;
  try {
    if (logoFile.value) {
      // Vuetify file input might return an array or a single file
      const fileToUpload = Array.isArray(logoFile.value) ? logoFile.value[0] : logoFile.value;
      if (fileToUpload) {
        const formData = new FormData();
        formData.append('logo', fileToUpload);
        
        const uploadRes = await $api.post('/saas/settings/logo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        if (uploadRes.data.success) {
          globalSettings.value.app_logo = uploadRes.data.url;
          logoFile.value = null;
        }
      }
    }

    const res = await $api.put('/saas/settings', globalSettings.value);
    if (res.data.success) {
      showToast('Global settings updated successfully', 'success');
      globalSettings.value = { ...globalSettings.value, ...res.data.data };
      await fetchSettings();
    }
  } catch (err) {
    showToast('Failed to save settings', 'error');
  } finally {
    loadingSettings.value = false;
  }
};

const toggleTenantStatus = async (item) => {
  const nextStatus = item.status === 'suspended' ? 'active' : 'suspended';
  try {
    const res = await $api.put(`/saas/tenants/${item.id}/status`, { status: nextStatus });
    if (res.data.success) {
      showToast(res.data.message, 'success');
      await fetchTenants();
      await fetchStats();
    }
  } catch (err) {
    showToast('Status change failed', 'error');
  }
};

const openHistory = async (item) => {
  historyDialog.show = true;
  historyDialog.loading = true;
  historyDialog.items = [];
  try {
    const res = await $api.get(`/saas/tenants/${item.id}/history`);
    if (res.data.success) {
      historyDialog.items = res.data.data;
    }
  } catch (err) {
    showToast('Failed to load history', 'error');
  } finally {
    historyDialog.loading = false;
  }
};

const openEditTenant = (item) => {
  tenantDialog.data = {
    id: item.id,
    plan_id: item.Plan?.id || null,
    status: item.status,
    billing_cycle: item.billing_cycle || 'monthly',
    trial_ends_at: item.trial_ends_at ? dayjs(item.trial_ends_at).format('YYYY-MM-DD') : '',
    subscription_starts_at: item.subscription_starts_at ? dayjs(item.subscription_starts_at).format('YYYY-MM-DD') : '',
    subscription_ends_at: item.subscription_ends_at ? dayjs(item.subscription_ends_at).format('YYYY-MM-DD') : ''
  };
  tenantDialog.show = true;
};

const saveTenantChanges = async () => {
  try {
    const payload = {
      plan_id: tenantDialog.data.plan_id,
      status: tenantDialog.data.status,
      billing_cycle: tenantDialog.data.billing_cycle,
      trial_ends_at: tenantDialog.data.trial_ends_at ? dayjs(tenantDialog.data.trial_ends_at).toISOString() : null,
      subscription_starts_at: tenantDialog.data.subscription_starts_at ? dayjs(tenantDialog.data.subscription_starts_at).toISOString() : null,
      subscription_ends_at: tenantDialog.data.subscription_ends_at ? dayjs(tenantDialog.data.subscription_ends_at).toISOString() : null
    };

    const res = await $api.put(`/saas/tenants/${tenantDialog.data.id}/plan`, payload);

    if (res.data.success) {
      showToast('Workspace subscription updated.', 'success');
      tenantDialog.show = false;
      await fetchTenants();
      await fetchStats();
      await fetchInvoices();
    }
  } catch (err) {
    showToast('Failed to update workspace configuration.', 'error');
  }
};

const openExtendSubscription = (item) => {
  extendDialog.data = {
    tenant_id: item.id,
    extension_type: 'month',
    custom_date: ''
  };
  extendDialog.show = true;
};

const saveExtendSubscription = async () => {
  extendDialog.loading = true;
  try {
    const res = await $api.put(`/saas/tenants/${extendDialog.data.tenant_id}/extend`, {
      extension_type: extendDialog.data.extension_type,
      custom_date: extendDialog.data.custom_date
    });
    if (res.data.success) {
      showToast('Subscription extended successfully', 'success');
      extendDialog.show = false;
      await fetchTenants();
      await fetchStats();
      await fetchInvoices();
    }
  } catch (err) {
    showToast(err.response?.data?.message || 'Failed to extend subscription', 'error');
  } finally {
    extendDialog.loading = false;
  }
};



const openCreatePlan = () => {
  planDialog.isEdit = false;
  planDialog.data = {
    name: '',
    price_monthly: 0,
    price_yearly: 0,
    max_users: 5,
    max_customers: 100,
    max_documents: 200,
    max_wallet_accounts: 3,
    is_active: true
  };
  planDialog.show = true;
};

const openEditPlan = (item) => {
  planDialog.isEdit = true;
  planDialog.data = {
    id: item.id,
    name: item.name,
    price_monthly: parseFloat(item.price_monthly),
    price_yearly: parseFloat(item.price_yearly),
    max_users: item.max_users,
    max_customers: item.max_customers,
    max_documents: item.max_documents,
    max_wallet_accounts: item.max_wallet_accounts,
    is_active: item.is_active
  };
  planDialog.show = true;
};

const savePlanChanges = async () => {
  try {
    let res;
    if (planDialog.isEdit) {
      res = await $api.put(`/saas/plans/${planDialog.data.id}`, planDialog.data);
    } else {
      res = await $api.post('/saas/plans', planDialog.data);
    }

    if (res.data.success) {
      showToast(planDialog.isEdit ? 'Plan updated.' : 'New Plan created.', 'success');
      planDialog.show = false;
      await fetchPlans();
      await fetchTenants();
    }
  } catch (err) {
    showToast('Failed to save subscription plan.', 'error');
  }
};

const paySaaSInvoice = async (id) => {
  try {
    const res = await $api.post(`/saas/invoices/${id}/pay`);
    if (res.data.success) {
      showToast('Invoice marked as paid.', 'success');
      await fetchInvoices();
      await fetchTenants();
      await fetchStats();
    }
  } catch (err) {
    showToast('Payment processing failed.', 'error');
  }
};

const openCreatePromoCode = () => {
  promoCodeDialog.isEdit = false;
  promoCodeDialog.data = {
    code: '',
    discount_type: 'percentage',
    discount_value: 0,
    valid_from: '',
    valid_until: '',
    max_uses: null,
    is_active: true
  };
  promoCodeDialog.show = true;
};

const openEditPromoCode = (item) => {
  promoCodeDialog.isEdit = true;
  promoCodeDialog.data = {
    id: item.id,
    code: item.code,
    discount_type: item.discount_type,
    discount_value: parseFloat(item.discount_value),
    valid_from: item.valid_from ? dayjs(item.valid_from).format('YYYY-MM-DD') : '',
    valid_until: item.valid_until ? dayjs(item.valid_until).format('YYYY-MM-DD') : '',
    max_uses: item.max_uses,
    is_active: item.is_active
  };
  promoCodeDialog.show = true;
};

const savePromoCode = async () => {
  try {
    // Convert empty strings to null for dates
    const payload = { ...promoCodeDialog.data };
    if (!payload.valid_from) payload.valid_from = null;
    if (!payload.valid_until) payload.valid_until = null;
    if (payload.max_uses === '') payload.max_uses = null;

    let res;
    if (promoCodeDialog.isEdit) {
      res = await $api.put(`/saas/promo-codes/${payload.id}`, payload);
    } else {
      res = await $api.post('/saas/promo-codes', payload);
    }

    if (res.data.success) {
      showToast(promoCodeDialog.isEdit ? 'Promo code updated.' : 'Promo code created.', 'success');
      promoCodeDialog.show = false;
      await fetchPromoCodes();
    } else {
      showToast(res.data.message || 'Failed to save promo code.', 'error');
    }
  } catch (err) {
    showToast(err.response?.data?.message || 'Failed to save promo code.', 'error');
  }
};

const handleLogout = async () => {
  await auth.logout();
};

const formatDate = (date) => dayjs(date).format('DD/MM/YYYY');
const formatCurrency = (val) => Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'success';
    case 'trial': return 'primary';
    case 'new_registration': return 'info';
    case 'suspended': return 'error';
    case 'expired': 
    case 'trial_expired': return 'error';
    case 'cancelled': return 'grey';
    default: return 'warning';
  }
};

const showToast = (text, color = 'success') => {
  toast.text = text;
  toast.color = color;
  toast.show = true;
};
</script>

<style scoped>
.saas-portal {
  background: #f8fafc;
  min-height: 100vh;
}

.text-gradient {
  background: linear-gradient(135deg, #0B57D0 0%, #002d72 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.glass-card {
  background: white !important;
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.02) !important;
}

.border-light {
  border: 1px solid rgba(0, 0, 0, 0.05) !important;
}
</style>
