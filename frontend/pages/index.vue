<template>
  <v-container fluid class="pa-2 pa-sm-4 pa-md-6">
    <template v-if="authStore.user?.Tenant?.status === 'new_registration'">
      <v-row class="fill-height align-center justify-center" style="min-height: 70vh;">
        <v-col cols="12" md="8" lg="6" class="text-center">
          <v-card class="glass-card pa-12 rounded-2xl border-light" variant="flat">
            <v-icon icon="mdi-account-clock" size="80" color="info" class="mb-6"></v-icon>
            <h1 class="text-h3 font-weight-black text-info mb-4">Account Approval Pending</h1>
            <p class="text-h6 text-secondary font-weight-medium mb-6">
              Your registration has been received successfully. Our team will review and approve your account shortly.
            </p>
            <v-btn color="primary" variant="tonal" size="x-large" class="rounded-lg font-weight-bold px-8" @click="authStore.fetchMe()">
              Refresh Status
            </v-btn>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <template v-else>
      <!-- Welcome Header -->
    <v-row class="mb-4 align-center">
      <v-col cols="12" md="8" class="py-1">
        <h1 class="text-h4 font-weight-black text-gradient mb-0">
          Hello, {{ authStore.user?.name || 'Administrator' }}
        </h1>
        <p class="text-subtitle-2 text-secondary font-weight-medium mb-0">
          Welcome back to docclear. Here is your business overview for today.
        </p>
      </v-col>
      <v-col cols="12" md="4" class="d-flex align-center justify-md-end flex-wrap" style="gap: 12px;">
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          height="40"
          class="px-6 font-weight-bold"
          to="/services"
        >
          New Service Order
        </v-btn>
      </v-col>
    </v-row>

    <!-- Stat Cards Row -->
    <v-row class="mb-10" align="stretch">
      <!-- Total Customers -->
      <v-col cols="12" sm="6" md="3">
        <v-card class="glass-card glass-card-hover pa-8 rounded-2xl h-100 d-flex flex-column justify-center" variant="flat">
          <div class="d-flex align-center justify-space-between mb-4">
            <v-avatar color="primary" variant="tonal" size="56" rounded="lg">
              <v-icon icon="mdi-account-group-outline" size="28" color="primary"></v-icon>
            </v-avatar>
            <div class="text-caption font-weight-bold opacity-60 uppercase ls-1">Customers</div>
          </div>
          <div class="text-h3 font-weight-black mb-1">{{ dashboardStore.stats.total_customers }}</div>
          <div class="text-caption text-secondary font-weight-medium">Active clients in CRM</div>
        </v-card>
      </v-col>

      <!-- Active Documents -->
      <v-col cols="12" sm="6" md="3">
        <v-card class="glass-card glass-card-hover pa-8 rounded-2xl h-100 d-flex flex-column justify-center" variant="flat">
          <div class="d-flex align-center justify-space-between mb-4">
            <v-avatar color="info" variant="tonal" size="56" rounded="lg">
              <v-icon icon="mdi-file-document-outline" size="28" color="info"></v-icon>
            </v-avatar>
            <div class="text-caption font-weight-bold opacity-60 uppercase ls-1">Documents</div>
          </div>
          <div class="text-h3 font-weight-black mb-1">{{ dashboardStore.stats.active_documents }}</div>
          <div class="text-caption text-secondary font-weight-medium">Files under management</div>
        </v-card>
      </v-col>

      <!-- Expiring Soon -->
      <v-col cols="12" sm="6" md="3">
        <v-card class="glass-card glass-card-hover pa-8 rounded-2xl h-100 d-flex flex-column justify-center cursor-pointer" variant="flat" to="/documents">
          <div class="d-flex align-center justify-space-between mb-4">
            <v-avatar color="warning" variant="tonal" size="56" rounded="lg">
              <v-icon icon="mdi-alert-circle-outline" size="28" color="warning"></v-icon>
            </v-avatar>
            <div class="text-caption font-weight-bold opacity-60 uppercase ls-1">Alerts</div>
          </div>
          <div class="text-h3 font-weight-black mb-1 text-warning">{{ dashboardStore.stats.expiring_soon }}</div>
          <div class="text-caption text-secondary font-weight-medium">
            Expiring in 30 days
          </div>
        </v-card>
      </v-col>

      <!-- Monthly Profit -->
      <v-col v-if="authStore.can('financials')" cols="12" sm="6" md="3">
        <v-card class="glass-card glass-card-hover pa-8 rounded-2xl h-100 d-flex flex-column justify-center" variant="flat">
          <div class="d-flex align-center justify-space-between mb-4">
            <v-avatar color="success" variant="tonal" size="56" rounded="lg">
              <v-icon icon="mdi-trending-up" size="28" color="success"></v-icon>
            </v-avatar>
            <div class="text-caption font-weight-bold opacity-60 uppercase ls-1">Net Profit</div>
          </div>
          <div class="text-h3 font-weight-black mb-1 text-success">
            <span class="text-h6 font-weight-bold mr-1">AED</span>{{ (dashboardStore.stats.monthly_profit || 0).toLocaleString() }}
          </div>
          <div class="text-caption text-secondary font-weight-medium">This calendar month</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Content Area -->
    <v-row>
      <!-- Recent Invoices -->
      <v-col cols="12" md="8">
        <v-card class="rounded-2xl glass-card overflow-hidden h-100" variant="flat">
          <v-toolbar color="transparent" flat class="px-8 mt-4">
            <v-icon icon="mdi-repeat" color="primary" class="mr-3" size="28"></v-icon>
            <span class="text-h5 font-weight-bold">Recent Billing Activity</span>
            <v-spacer></v-spacer>
            <v-btn variant="text" size="small" color="primary" to="/invoices" class="font-weight-bold">View All</v-btn>
          </v-toolbar>
          
          <v-table v-if="dashboardStore.recentActivity.recent_invoices.length" class="px-6 pb-8 mt-4">
            <thead>
              <tr class="text-uppercase text-caption font-weight-black opacity-60">
                <th class="py-4">Invoice #</th>
                <th>Client</th>
                <th>Amount</th>
                <th class="text-center">Status</th>
                <th class="text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inv in dashboardStore.recentActivity.recent_invoices" :key="inv.id">
                <td class="font-weight-bold text-high-emphasis">{{ inv.invoice_number }}</td>
                <td class="font-weight-medium">{{ inv.Customer?.name }}</td>
                <td class="font-weight-black">AED {{ parseFloat(inv.total).toFixed(2) }}</td>
                <td class="text-center">
                  <v-chip
                    :color="getStatusColor(inv.status)"
                    size="x-small"
                    variant="flat"
                    class="font-weight-black text-uppercase px-3"
                  >
                    {{ inv.status }}
                  </v-chip>
                </td>
                <td class="text-right text-caption text-secondary font-weight-medium">
                  {{ formatDate(inv.createdAt) }}
                </td>
              </tr>
            </tbody>
          </v-table>
          <div v-else class="pa-12">
            <EmptyState 
              title="No Recent Activity" 
              subtitle="Recently created invoices will appear here." 
              icon="mdi-invoice-text-outline"
            />
          </div>
        </v-card>
      </v-col>

      <!-- Expiring Alerts -->
      <v-col cols="12" md="4">
        <v-card class="rounded-2xl glass-card overflow-hidden h-100" variant="flat">
          <v-toolbar color="transparent" flat class="px-8 mt-4">
            <v-icon icon="mdi-clock-alert-outline" color="error" class="mr-3" size="28"></v-icon>
            <span class="text-h5 font-weight-bold">Critical Alerts</span>
          </v-toolbar>

          <v-list class="pa-6 bg-transparent">
            <template v-if="dashboardStore.recentActivity.expiring_documents.length">
              <v-list-item
                v-for="doc in dashboardStore.recentActivity.expiring_documents"
                :key="doc.id"
                class="mb-4 rounded-xl border border-dashed pa-4"
                :class="doc.days_remaining <= 7 ? 'bg-error-lighten-5' : 'bg-white-30'"
                style="border-color: rgba(0,0,0,0.05) !important;"
              >
                <template v-slot:prepend>
                  <v-avatar :color="doc.days_remaining <= 7 ? 'error' : 'warning'" size="44" variant="tonal">
                      <v-icon icon="mdi-file-clock-outline" size="22"></v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title class="font-weight-bold text-subtitle-1">
                  {{ doc.DocumentType?.name || doc.type || 'Document' }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption font-weight-medium opacity-70">
                  {{ doc.Customer?.name }}
                </v-list-item-subtitle>

                <template v-slot:append>
                  <div class="text-right d-flex flex-column justify-center align-end">
                      <span class="text-h5 font-weight-black" :class="doc.days_remaining <= 7 ? 'text-error' : 'text-warning'">
                          {{ doc.days_remaining <= 0 ? Math.abs(doc.days_remaining) : doc.days_remaining }}
                      </span>
                      <span class="text-overline opacity-60 mt-n2 font-weight-black">
                          {{ doc.days_remaining < 0 ? 'OVERDUE' : (doc.days_remaining === 0 ? 'TODAY' : 'DAYS') }}
                      </span>
                  </div>
                </template>
              </v-list-item>
            </template>

            <div v-else class="pa-12">
                <EmptyState 
                    title="All Clear" 
                    subtitle="No documents are expiring within the next 30 days." 
                    icon="mdi-shield-check-outline"
                />
            </div>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
    </template>
  </v-container>
</template>

<script setup>
import { onMounted } from 'vue';
import { useDashboardStore } from '~/stores/dashboard';
import { useAuthStore } from '~/stores/auth';
import EmptyState from '~/components/common/EmptyState.vue';
import dayjs from 'dayjs';

const dashboardStore = useDashboardStore();
const authStore = useAuthStore();

onMounted(async () => {
    await Promise.all([
        dashboardStore.fetchStats(),
        dashboardStore.fetchRecentActivity()
    ]);
});

const getStatusColor = (status) => {
    switch (status) {
        case 'Paid': return 'success';
        case 'Draft': return 'secondary';
        case 'Sent': return 'info';
        case 'Overdue': return 'error';
        default: return 'secondary';
    }
};

const formatDate = (date) => dayjs(date).format('DD MMM, YYYY');
</script>

<style scoped>
.ls-1 {
  letter-spacing: 1px;
}
.bg-white-30 {
  background: rgba(255, 255, 255, 0.3);
}
.bg-error-lighten-5 {
  background: rgba(239, 68, 68, 0.05);
}
</style>
