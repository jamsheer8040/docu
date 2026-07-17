<template>
  <div>
    <!-- Stats Row -->
    <v-row>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 border rounded-xl h-100" border variant="flat">
          <div class="text-caption text-grey text-uppercase font-weight-bold mb-1">Proposed Capital</div>
          <div class="text-h5 font-weight-bold text-primary">{{ formatCurrency(stats?.proposed_capital) }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 border rounded-xl h-100" border variant="flat">
          <div class="text-caption text-grey text-uppercase font-weight-bold mb-1">Total Received</div>
          <div class="text-h5 font-weight-bold text-success">{{ formatCurrency(stats?.total_received) }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 border rounded-xl h-100" border variant="flat">
          <div class="text-caption text-grey text-uppercase font-weight-bold mb-1">Outstanding Capital</div>
          <div class="text-h5 font-weight-bold text-orange">{{ formatCurrency(stats?.outstanding_capital) }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 border rounded-xl h-100" border variant="flat">
          <div class="text-caption text-grey text-uppercase font-weight-bold mb-1">Excess Capital</div>
          <div class="text-h5 font-weight-bold text-info">{{ formatCurrency(stats?.excess_capital) }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 border rounded-xl h-100" border variant="flat">
          <div class="text-caption text-grey text-uppercase font-weight-bold mb-1">Total Shareholders</div>
          <div class="text-h5 font-weight-bold">{{ stats?.total_shareholders || 0 }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 border rounded-xl h-100" border variant="flat">
          <div class="text-caption text-grey text-uppercase font-weight-bold mb-1">Dividends Declared</div>
          <div class="text-h5 font-weight-bold text-deep-purple">{{ formatCurrency(stats?.dividends_declared) }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="pa-4 border rounded-xl h-100" border variant="flat">
          <div class="text-caption text-grey text-uppercase font-weight-bold mb-1">Dividends Paid</div>
          <div class="text-h5 font-weight-bold text-success">{{ formatCurrency(stats?.dividends_paid) }}</div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useManagementStore } from '~/stores/management';

const store = useManagementStore();
const stats = ref(null);

const formatCurrency = (val) => {
  if (!val) return 'AED 0.00';
  return 'AED ' + Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

onMounted(async () => {
  stats.value = await store.fetchDashboardStats();
});
</script>
