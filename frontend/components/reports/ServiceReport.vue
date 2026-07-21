<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <v-row class="mb-4 align-center">
      <v-col cols="12" md="6">
        <h1 class="text-h4 font-weight-bold color-primary">
          <v-icon icon="mdi-briefcase" class="mr-2" color="purple"></v-icon>
          Service-Wise Report
        </h1>
        <p class="text-subtitle-1 text-grey-darken-1">Aggregate performance metrics grouped by individual services</p>
      </v-col>
      <v-col cols="12" md="6" class="text-md-right">
        <v-btn color="primary" prepend-icon="mdi-download" @click="exportCSV" :loading="loading">
          Export to CSV
        </v-btn>
      </v-col>
    </v-row>

    <!-- Filters -->
    <v-card class="pa-4 border rounded-xl mb-6 bg-surface" variant="flat">
      <v-row dense>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="filters.from"
            type="date"
            label="Date From"
            variant="outlined"
            density="comfortable"
            hide-details
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="4">
          <v-text-field
            v-model="filters.to"
            type="date"
            label="Date To"
            variant="outlined"
            density="comfortable"
            hide-details
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="4" class="d-flex align-center">
          <v-btn color="primary" variant="tonal" block height="48" @click="fetchData">Apply Filters</v-btn>
        </v-col>
      </v-row>
    </v-card>

    <!-- Data Table -->
    <v-card class="border rounded-xl" variant="flat">
      <v-data-table
        :headers="headers"
        :items="items"
        :loading="loading"
        hover
        :items-per-page="50"
      >
        <template v-slot:item.total_quantity="{ item }">
          <span class="font-weight-medium">{{ item.total_quantity }}</span>
        </template>
        <template v-slot:item.total_revenue="{ item }">
          <span class="font-weight-bold">AED {{ parseFloat(item.total_revenue || 0).toFixed(2) }}</span>
        </template>
        <template v-slot:item.total_cost="{ item }">
          <span class="text-error">AED {{ parseFloat(item.total_cost || 0).toFixed(2) }}</span>
        </template>
        <template v-slot:item.gross_profit="{ item }">
          <span class="text-success font-weight-bold">AED {{ parseFloat(item.gross_profit || 0).toFixed(2) }}</span>
        </template>
        <template v-slot:tfoot>
          <tr v-if="items.length > 0" class="bg-grey-lighten-4 font-weight-black">
            <td class="text-right">Total:</td>
            <td class="text-center">{{ currentTotals.total_quantity }}</td>
            <td class="text-right">AED {{ currentTotals.total_revenue.toFixed(2) }}</td>
            <td class="text-right text-error">AED {{ currentTotals.total_cost.toFixed(2) }}</td>
            <td class="text-right text-success">AED {{ currentTotals.gross_profit.toFixed(2) }}</td>
          </tr>
        </template>
      </v-data-table>
    </v-card>
  </v-container>
</template>

<script setup>
import { useUIStore } from '~/stores/ui'

const uiStore = useUIStore()
import { ref, reactive, computed, onMounted } from 'vue';

const { $api } = useNuxtApp();

const loading = ref(false);
const items = ref([]);

const filters = reactive({
  from: '',
  to: ''
});

const currentTotals = computed(() => {
  return items.value.reduce((acc, curr) => {
    acc.total_quantity += parseInt(curr.total_quantity || 0)
    acc.total_revenue += parseFloat(curr.total_revenue || 0)
    acc.total_cost += parseFloat(curr.total_cost || 0)
    acc.gross_profit += parseFloat(curr.gross_profit || 0)
    return acc
  }, { total_quantity: 0, total_revenue: 0, total_cost: 0, gross_profit: 0 })
});

const headers = [
  { title: 'Service / Item Name', key: 'description', sortable: true },
  { title: 'Total Quantity Sold', key: 'total_quantity', sortable: true, align: 'center' },
  { title: 'Total Revenue', key: 'total_revenue', sortable: true, align: 'end' },
  { title: 'Total Cost', key: 'total_cost', sortable: true, align: 'end' },
  { title: 'Gross Profit', key: 'gross_profit', sortable: true, align: 'end' }
];

const fetchData = async () => {
  loading.value = true;
  try {
    const params = {};
    if (filters.from) params.from = filters.from;
    if (filters.to) params.to = filters.to;

    const res = await $api.get('/reports/service-wise-details', { params });
    if (res.data?.success) {
      items.value = res.data.data;
    }
  } catch (err) {
    console.error('Failed to fetch service wise report', err);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchData();
});

const exportCSV = () => {
  if (!items.value.length) return uiStore.showError('No data to export');
  
  const csvHeaders = ['Service Name', 'Total Quantity Sold', 'Total Revenue', 'Total Cost', 'Gross Profit'];
  const rows = items.value.map(item => [
    `"${item.description || ''}"`,
    item.total_quantity,
    parseFloat(item.total_revenue || 0).toFixed(2),
    parseFloat(item.total_cost || 0).toFixed(2),
    parseFloat(item.gross_profit || 0).toFixed(2)
  ]);

  const csvContent = [csvHeaders.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Service_Report_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>
