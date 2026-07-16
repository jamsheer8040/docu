<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <v-row class="mb-4 align-center">
      <v-col cols="12" md="6">
        <h1 class="text-h4 font-weight-bold color-primary">
          <v-icon icon="mdi-scale-balance" class="mr-2" color="primary"></v-icon>
          Financial Control & Balance Verification
        </h1>
        <p class="text-subtitle-1 text-grey-darken-1">Cross-match financial records, ensure data integrity and track actual liquidity</p>
      </v-col>
      <v-col cols="12" md="6" class="text-md-right">
        <v-btn color="primary" prepend-icon="mdi-refresh" @click="fetchData" :loading="loading" class="mr-4">
          Refresh Data
        </v-btn>
        <v-btn color="secondary" prepend-icon="mdi-printer" @click="printReport" :loading="loading">
          Print
        </v-btn>
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-card class="pa-4 border rounded-xl mb-6 bg-surface" variant="flat">
      <v-row dense align="center">
        <v-col cols="12" md="3">
          <v-text-field
            v-model="filters.from"
            type="date"
            label="Date From"
            variant="outlined"
            density="comfortable"
            hide-details
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="3">
          <v-text-field
            v-model="filters.to"
            type="date"
            label="Date To"
            variant="outlined"
            density="comfortable"
            hide-details
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="2">
          <v-btn color="primary" variant="tonal" block height="48" @click="fetchData">Apply Filters</v-btn>
        </v-col>
      </v-row>
    </v-card>

    <div v-if="loading" class="d-flex justify-center my-12">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <div v-else-if="data">
      <!-- Top Health Status -->
      <v-card class="border rounded-2xl mb-8 overflow-hidden" variant="flat">
        <div class="d-flex pa-6" :class="isBalanced ? 'bg-success-container' : 'bg-error-container'">
          <div class="d-flex flex-column justify-center align-center mr-8 px-6 border-e" style="border-color: rgba(0,0,0,0.1) !important;">
            <v-icon :icon="isBalanced ? 'mdi-check-decagram' : 'mdi-alert-decagram'" :color="isBalanced ? 'success' : 'error'" size="64" class="mb-2"></v-icon>
            <span class="text-h6 font-weight-black text-uppercase" :class="isBalanced ? 'text-success' : 'text-error'">
              {{ isBalanced ? 'Balanced' : 'Financial Mismatch' }}
            </span>
          </div>
          <div class="flex-grow-1">
            <v-row>
              <v-col cols="6" md="3">
                <div class="text-caption font-weight-bold opacity-70 text-uppercase">Total Revenue</div>
                <div class="text-h6 font-weight-bold">AED {{ formatNumber(data.revenue_control.total_revenue) }}</div>
              </v-col>
              <v-col cols="6" md="3">
                <div class="text-caption font-weight-bold opacity-70 text-uppercase">Net Profit</div>
                <div class="text-h6 font-weight-bold color-primary">AED {{ formatNumber(data.profit_calculation.net_profit) }}</div>
              </v-col>
              <v-col cols="6" md="3">
                <div class="text-caption font-weight-bold opacity-70 text-uppercase">Wallet Balance</div>
                <div class="text-h6 font-weight-bold text-success">AED {{ formatNumber(data.business_position.wallet_balances) }}</div>
              </v-col>
              <v-col cols="6" md="3">
                <div class="text-caption font-weight-bold opacity-70 text-uppercase" :class="!isBalanced ? 'text-error' : ''">Balance Difference</div>
                <div class="text-h5 font-weight-black" :class="!isBalanced ? 'text-error' : 'text-success'">
                  AED {{ formatNumber(data.business_position.difference) }}
                </div>
              </v-col>
            </v-row>
          </div>
        </div>
      </v-card>

      <!-- Main Dashboard Layout -->
      <v-row class="mb-8">
        <!-- LEFT PANEL - Money Generated -->
        <v-col cols="12" md="6">
          <h2 class="text-h5 font-weight-black mb-4 d-flex align-center">
            <v-icon color="success" class="mr-2">mdi-trending-up</v-icon> Money Generated
          </h2>
          
          <!-- Revenue Control Card -->
          <v-card class="pa-5 rounded-2xl border mb-4 bg-surface" variant="flat">
            <div class="d-flex align-center justify-space-between mb-4">
              <span class="text-h6 font-weight-bold">Revenue & Receivable Control</span>
              <v-chip size="small" :color="data.revenue_control.matched ? 'success' : 'error'" class="font-weight-bold">
                <v-icon start :icon="data.revenue_control.matched ? 'mdi-check' : 'mdi-close'"></v-icon>
                {{ data.revenue_control.matched ? 'Matched' : 'Mismatch' }}
              </v-chip>
            </div>
            
            <div class="d-flex justify-space-between mb-2">
              <span class="text-body-1 opacity-80">Total Invoice Value</span>
              <span class="text-body-1 font-weight-black">AED {{ formatNumber(data.revenue_control.total_revenue) }}</span>
            </div>
            <div class="d-flex justify-space-between mb-2">
              <span class="text-body-1 opacity-80">Customer Payments Received</span>
              <span class="text-body-1 font-weight-bold text-success">AED {{ formatNumber(data.revenue_control.payments_received) }}</span>
            </div>
            <div class="d-flex justify-space-between mb-4">
              <span class="text-body-1 opacity-80">Outstanding Receivable</span>
              <span class="text-body-1 font-weight-bold text-orange-darken-3">AED {{ formatNumber(data.revenue_control.outstanding_receivable) }}</span>
            </div>
            
            <v-divider class="mb-4"></v-divider>
            <div class="bg-grey-lighten-4 pa-3 rounded-lg text-caption font-mono">
              <span class="opacity-60">Validation: Invoice Amount ({{formatNumber(data.revenue_control.total_revenue)}}) = Received ({{formatNumber(data.revenue_control.payments_received)}}) + Receivable ({{formatNumber(data.revenue_control.outstanding_receivable)}})</span>
            </div>
          </v-card>

          <!-- Gov Fee Control Card -->
          <v-card class="pa-5 rounded-2xl border mb-4 bg-surface" variant="flat">
            <div class="d-flex align-center justify-space-between mb-4">
              <span class="text-h6 font-weight-bold">Government Fee / Cost of Sales</span>
              <v-chip size="small" :color="data.cost_control.matched ? 'success' : 'error'" class="font-weight-bold">
                <v-icon start :icon="data.cost_control.matched ? 'mdi-check' : 'mdi-close'"></v-icon>
                {{ data.cost_control.matched ? 'Matched' : 'Mismatch' }}
              </v-chip>
            </div>
            
            <div class="d-flex justify-space-between mb-2">
              <span class="text-body-1 opacity-80">Government Fees From Invoices</span>
              <span class="text-body-1 font-weight-black text-error">AED {{ formatNumber(data.cost_control.gov_fees_invoices) }}</span>
            </div>
            <div class="d-flex justify-space-between mb-2">
              <span class="text-body-1 opacity-80">Gov Fees Paid From Wallets</span>
              <span class="text-body-1 font-weight-bold text-error">AED {{ formatNumber(data.cost_control.gov_fees_paid) }}</span>
            </div>
            <div class="d-flex justify-space-between mb-4">
              <span class="text-body-1 opacity-80">Pending Government Fees</span>
              <span class="text-body-1 font-weight-bold text-orange-darken-3">AED {{ formatNumber(data.cost_control.pending_gov_fees) }}</span>
            </div>

            <v-divider class="mb-4"></v-divider>
            <div class="bg-grey-lighten-4 pa-3 rounded-lg text-caption font-mono">
              <span class="opacity-60">Validation: Invoice Gov Fees ({{formatNumber(data.cost_control.gov_fees_invoices)}}) = Wallet Paid ({{formatNumber(data.cost_control.gov_fees_paid)}}) + Pending ({{formatNumber(data.cost_control.pending_gov_fees)}})</span>
            </div>
          </v-card>
          
          <!-- Profit Calculation Card -->
          <v-card class="pa-5 rounded-2xl border bg-blue-lighten-5" variant="flat">
            <div class="text-h6 font-weight-bold mb-4">Profit Calculation (Gross)</div>
            <div class="d-flex justify-space-between mb-2">
              <span class="text-body-1 opacity-80">Total Revenue</span>
              <span class="text-body-1 font-weight-bold">AED {{ formatNumber(data.revenue_control.total_revenue) }}</span>
            </div>
            <div class="d-flex justify-space-between mb-3 border-b pb-3">
              <span class="text-body-1 opacity-80">Government Fees</span>
              <span class="text-body-1 font-weight-bold text-error">- AED {{ formatNumber(data.cost_control.gov_fees_invoices) }}</span>
            </div>
            <div class="d-flex justify-space-between">
              <span class="text-h6 font-weight-bold">Gross Profit</span>
              <span class="text-h6 font-weight-black color-primary">AED {{ formatNumber(data.profit_calculation.gross_profit) }}</span>
            </div>
          </v-card>
        </v-col>

        <!-- RIGHT PANEL - Money Used -->
        <v-col cols="12" md="6">
          <h2 class="text-h5 font-weight-black mb-4 d-flex align-center">
            <v-icon color="error" class="mr-2">mdi-trending-down</v-icon> Money Used
          </h2>
          
          <!-- Expense Control Card -->
          <v-card class="pa-5 rounded-2xl border mb-4 bg-surface" variant="flat">
            <div class="d-flex align-center justify-space-between mb-4">
              <span class="text-h6 font-weight-bold">Expense Control</span>
              <v-chip size="small" :color="data.expense_control.matched ? 'success' : 'error'" class="font-weight-bold">
                <v-icon start :icon="data.expense_control.matched ? 'mdi-check' : 'mdi-close'"></v-icon>
                {{ data.expense_control.matched ? 'Matched' : 'Mismatch' }}
              </v-chip>
            </div>
            
            <div class="d-flex justify-space-between mb-2">
              <span class="text-body-1 opacity-80">Total Expenses Created</span>
              <span class="text-body-1 font-weight-black text-error">AED {{ formatNumber(data.expense_control.total_expenses) }}</span>
            </div>
            <div class="d-flex justify-space-between mb-2">
              <span class="text-body-1 opacity-80">Expenses Paid From Wallets</span>
              <span class="text-body-1 font-weight-bold text-error">AED {{ formatNumber(data.expense_control.expenses_paid) }}</span>
            </div>
            <div class="d-flex justify-space-between mb-4">
              <span class="text-body-1 opacity-80">Outstanding Expense Payable</span>
              <span class="text-body-1 font-weight-bold text-orange-darken-3">AED {{ formatNumber(data.expense_control.outstanding_payables) }}</span>
            </div>
            
            <v-divider class="mb-4"></v-divider>
            <div class="bg-grey-lighten-4 pa-3 rounded-lg text-caption font-mono">
              <span class="opacity-60">Validation: Expenses Created ({{formatNumber(data.expense_control.total_expenses)}}) = Paid ({{formatNumber(data.expense_control.expenses_paid)}}) + Payable ({{formatNumber(data.expense_control.outstanding_payables)}})</span>
            </div>
          </v-card>

          <!-- Net Profit Card -->
          <v-card class="pa-5 rounded-2xl border mb-4 bg-green-lighten-5" variant="flat">
            <div class="text-h6 font-weight-bold mb-4">True Net Profit</div>
            <div class="d-flex justify-space-between mb-2">
              <span class="text-body-1 opacity-80">Gross Profit</span>
              <span class="text-body-1 font-weight-bold">AED {{ formatNumber(data.profit_calculation.gross_profit) }}</span>
            </div>
            <div class="d-flex justify-space-between mb-3 border-b pb-3" style="border-color: rgba(0,0,0,0.1) !important;">
              <span class="text-body-1 opacity-80">Operating Expenses</span>
              <span class="text-body-1 font-weight-bold text-error">- AED {{ formatNumber(data.expense_control.total_expenses) }}</span>
            </div>
            <div class="d-flex justify-space-between">
              <span class="text-h6 font-weight-bold">Net Profit</span>
              <span class="text-h6 font-weight-black text-success">AED {{ formatNumber(data.profit_calculation.net_profit) }}</span>
            </div>
          </v-card>

          <!-- Financial Position Verification -->
          <v-card class="pa-5 rounded-2xl border bg-surface" variant="flat">
            <div class="d-flex align-center justify-space-between mb-4">
              <span class="text-h6 font-weight-bold">Financial Position Verification</span>
              <v-chip size="small" :color="data.business_position.difference === 0 ? 'success' : 'error'" class="font-weight-bold">
                {{ data.business_position.difference === 0 ? 'Perfectly Balanced' : 'Imbalance Detected' }}
              </v-chip>
            </div>
            
            <div class="d-flex justify-space-between mb-1">
              <span class="text-body-2 opacity-80">Wallet Balances</span>
              <span class="text-body-2 font-weight-medium">AED {{ formatNumber(data.business_position.wallet_balances) }}</span>
            </div>
            <div class="d-flex justify-space-between mb-1">
              <span class="text-body-2 opacity-80">+ Customer Receivables</span>
              <span class="text-body-2 font-weight-medium">AED {{ formatNumber(data.business_position.receivables) }}</span>
            </div>
            <div class="d-flex justify-space-between mb-3 border-b pb-3">
              <span class="text-body-2 opacity-80">- Outstanding Payables</span>
              <span class="text-body-2 font-weight-medium">AED {{ formatNumber(data.business_position.payables) }}</span>
            </div>
            <div class="d-flex justify-space-between mb-4">
              <span class="text-subtitle-1 font-weight-bold">Expected Business Value</span>
              <span class="text-subtitle-1 font-weight-black">AED {{ formatNumber(data.business_position.expected_value) }}</span>
            </div>

            <v-divider class="mb-4"></v-divider>
            <div class="bg-grey-lighten-4 pa-3 rounded-lg text-caption font-mono d-flex justify-space-between">
              <span class="opacity-60">Calculated (Opening Bal + Rev - Cost - Exp)</span>
              <span class="font-weight-bold" :class="data.business_position.difference === 0 ? 'text-success' : 'text-error'">
                AED {{ formatNumber(data.business_position.calculated_value) }}
              </span>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <!-- Wallet Reconciliation Table -->
      <v-card class="border rounded-2xl mb-8 bg-surface" variant="flat">
        <v-toolbar color="surface" flat class="px-6 border-b">
          <span class="text-h6 font-weight-bold">Wallet Reconciliation Table</span>
        </v-toolbar>
        <v-table hover>
          <thead>
            <tr>
              <th>Wallet</th>
              <th class="text-right">Opening Balance</th>
              <th class="text-right text-success">Money Received</th>
              <th class="text-right text-error">Money Paid</th>
              <th class="text-right font-weight-bold bg-grey-lighten-4">Expected Balance</th>
              <th class="text-right font-weight-bold">Actual Balance</th>
              <th class="text-right">Difference</th>
              <th class="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="w in data.wallets" :key="w.wallet_name">
              <td class="font-weight-medium">{{ w.wallet_name }}</td>
              <td class="text-right">{{ formatNumber(w.opening_balance) }}</td>
              <td class="text-right text-success">+{{ formatNumber(w.money_received) }}</td>
              <td class="text-right text-error">-{{ formatNumber(w.money_paid) }}</td>
              <td class="text-right font-weight-bold bg-grey-lighten-4">{{ formatNumber(w.expected_balance) }}</td>
              <td class="text-right font-weight-black color-primary">{{ formatNumber(w.actual_balance) }}</td>
              <td class="text-right font-weight-bold" :class="w.difference !== 0 ? 'text-error' : 'text-success'">
                {{ formatNumber(w.difference) }}
              </td>
              <td class="text-center">
                <v-icon :color="w.matched ? 'success' : 'error'">{{ w.matched ? 'mdi-check-circle' : 'mdi-alert-circle' }}</v-icon>
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card>

      <!-- Audit & Error Detection Section -->
      <v-expansion-panels variant="accordion" class="border rounded-2xl overflow-hidden">
        <v-expansion-panel>
          <v-expansion-panel-title class="font-weight-bold">
            <v-icon color="warning" class="mr-2">mdi-shield-search</v-icon>
            Audit & Error Detection Panel
          </v-expansion-panel-title>
          <v-expansion-panel-text class="pa-4 bg-surface">
            <v-row>
              <!-- Double Entry Check -->
              <v-col cols="12" md="6">
                <v-card class="pa-4 rounded-xl border" variant="flat">
                  <div class="d-flex align-center justify-space-between mb-4">
                    <span class="text-subtitle-1 font-weight-bold">Double Entry Validation</span>
                    <v-chip size="small" :color="data.audit.double_entry.balanced ? 'success' : 'error'">
                      {{ data.audit.double_entry.balanced ? 'Balanced' : 'Imbalance' }}
                    </v-chip>
                  </div>
                  <div class="d-flex justify-space-between mb-2">
                    <span class="text-body-2 opacity-80">Total Debits</span>
                    <span class="text-body-2 font-weight-black">AED {{ formatNumber(data.audit.double_entry.total_debits) }}</span>
                  </div>
                  <div class="d-flex justify-space-between">
                    <span class="text-body-2 opacity-80">Total Credits</span>
                    <span class="text-body-2 font-weight-black">AED {{ formatNumber(data.audit.double_entry.total_credits) }}</span>
                  </div>
                </v-card>
              </v-col>
              <!-- Duplicates Check -->
              <v-col cols="12" md="6">
                <v-card class="pa-4 rounded-xl border h-100" variant="flat">
                  <div class="text-subtitle-1 font-weight-bold mb-4">Potential Duplicate Invoices</div>
                  <div v-if="data.audit.duplicate_invoices.length === 0" class="text-success font-weight-medium d-flex align-center">
                    <v-icon class="mr-2" color="success">mdi-check-all</v-icon> No duplicates detected.
                  </div>
                  <v-list v-else density="compact" bg-color="transparent" class="pa-0">
                    <v-list-item v-for="(dup, i) in data.audit.duplicate_invoices" :key="i" class="px-0">
                      <template v-slot:prepend>
                        <v-icon color="error">mdi-alert-box</v-icon>
                      </template>
                      <v-list-item-title class="font-weight-medium text-error">{{ dup.invoice_number }} - AED {{ formatNumber(dup.amount) }}</v-list-item-title>
                      <v-list-item-subtitle>{{ formatDate(dup.date) }}</v-list-item-subtitle>
                    </v-list-item>
                  </v-list>
                </v-card>
              </v-col>
            </v-row>
          </v-expansion-panel-text>
        </v-expansion-panel>
      </v-expansion-panels>
    </div>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useNuxtApp } from '#app';

const { $api } = useNuxtApp();

const loading = ref(true);
const data = ref(null);
const filters = reactive({
  from: '',
  to: ''
});

const isBalanced = computed(() => {
  if (!data.value) return false;
  return data.value.business_position.difference === 0 
      && data.value.revenue_control.matched 
      && data.value.expense_control.matched
      && data.value.cost_control.matched
      && data.value.audit.double_entry.balanced;
});

const formatNumber = (num) => {
  return parseFloat(num || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-GB');
};

const fetchData = async () => {
  loading.value = true;
  try {
    const params = {};
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;

    const res = await $api.get('/reports/balance-sheet', { params });
    if (res.data?.success) {
      data.value = res.data.data;
    }
  } catch (error) {
    console.error('Error fetching balance sheet:', error);
  } finally {
    loading.value = false;
  }
};

const printReport = () => {
  window.print();
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped>
@media print {
  .v-btn {
    display: none !important;
  }
  .v-expansion-panel {
    break-inside: avoid;
  }
}
.font-mono {
  font-family: monospace;
}
</style>
