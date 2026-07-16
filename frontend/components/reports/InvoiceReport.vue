<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <v-row class="mb-4 align-center">
      <v-col cols="12" md="6">
        <h1 class="text-h4 font-weight-bold color-primary">
          <v-icon icon="mdi-receipt-text" class="mr-2" color="primary"></v-icon>
          Invoice Report
        </h1>
        <p class="text-subtitle-1 text-grey-darken-1">Detailed list of all invoices</p>
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
          <v-select
            v-model="filters.status"
            :items="['All', 'Draft', 'Sent', 'Issued', 'Paid', 'Partially Paid', 'Cancelled']"
            label="Status"
            variant="outlined"
            density="comfortable"
            hide-details
          ></v-select>
        </v-col>
        <v-col cols="12" md="2">
          <v-text-field
            v-model="filters.search"
            label="Search Inv/Customer"
            variant="outlined"
            density="comfortable"
            hide-details
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="2" class="d-flex align-center">
          <v-btn color="primary" variant="tonal" block height="48" @click="fetchData">Apply Filters</v-btn>
        </v-col>
      </v-row>
    </v-card>

    <!-- Data Table -->
    <v-card class="border rounded-xl" variant="flat">
      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="items"
        :items-length="totalItems"
        :loading="loading"
        @update:options="onOptionsUpdate"
        hover
      >
        <template v-slot:item.created_at="{ item }">
          {{ formatDate(item.created_at) }}
        </template>
        <template v-slot:item.status="{ item }">
          <v-chip
            :color="item.status === 'Paid' ? 'success' : (item.status === 'Partially Paid' ? 'orange' : (item.status === 'Cancelled' ? 'error' : 'primary'))"
            size="small"
            class="font-weight-bold"
          >
            {{ item.status }}
          </v-chip>
        </template>
        <template v-slot:item.Customer.name="{ item }">
          <span class="font-weight-medium">{{ item.Customer?.name || 'N/A' }}</span>
        </template>
        <template v-slot:item.subtotal="{ item }">
          AED {{ parseFloat(item.subtotal || 0).toFixed(2) }}
        </template>
        <template v-slot:item.tax="{ item }">
          AED {{ parseFloat(item.tax || 0).toFixed(2) }}
        </template>
        <template v-slot:item.total="{ item }">
          <span class="font-weight-bold">AED {{ parseFloat(item.total || 0).toFixed(2) }}</span>
        </template>
        <template v-slot:item.paid_amount="{ item }">
          <span class="text-success font-weight-medium">AED {{ parseFloat(item.paid_amount || 0).toFixed(2) }}</span>
        </template>
      </v-data-table-server>
    </v-card>
  </v-container>
</template>

<script setup>
import { ref, reactive } from 'vue';

const { $api } = useNuxtApp();

const loading = ref(false);
const items = ref([]);
const totalItems = ref(0);
const itemsPerPage = ref(15);
const currentPage = ref(1);

const filters = reactive({
  from: '',
  to: '',
  status: 'All',
  search: ''
});

const headers = [
  { title: 'Date', key: 'created_at', sortable: false },
  { title: 'Invoice No', key: 'invoice_number', sortable: false },
  { title: 'Customer', key: 'Customer.name', sortable: false },
  { title: 'Subtotal', key: 'subtotal', sortable: false, align: 'end' },
  { title: 'Tax', key: 'tax', sortable: false, align: 'end' },
  { title: 'Total', key: 'total', sortable: false, align: 'end' },
  { title: 'Paid Amount', key: 'paid_amount', sortable: false, align: 'end' },
  { title: 'Status', key: 'status', sortable: false, align: 'center' }
];

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB');
};

const fetchData = async () => {
  loading.value = true;
  try {
    const params = {
      page: currentPage.value,
      limit: itemsPerPage.value
    };
    
    if (filters.from) params.date_from = filters.from;
    if (filters.to) params.date_to = filters.to;
    if (filters.status !== 'All') params.status = filters.status;
    if (filters.search) params.search = filters.search;

    const res = await $api.get('/invoices', { params });
    if (res.data?.success) {
      items.value = res.data.data;
      totalItems.value = res.data.meta?.total || 0;
    }
  } catch (err) {
    console.error('Failed to fetch invoice report', err);
  } finally {
    loading.value = false;
  }
};

const onOptionsUpdate = ({ page, itemsPerPage: limit }) => {
  currentPage.value = page;
  itemsPerPage.value = limit;
  fetchData();
};

const exportCSV = () => {
  if (!items.value.length) return alert('No data to export');
  
  const csvHeaders = ['Date', 'Invoice No', 'Customer', 'Subtotal', 'Tax', 'Total', 'Paid Amount', 'Status'];
  const rows = items.value.map(item => [
    formatDate(item.created_at),
    item.invoice_number,
    `"${item.Customer?.name || ''}"`,
    parseFloat(item.subtotal || 0).toFixed(2),
    parseFloat(item.tax || 0).toFixed(2),
    parseFloat(item.total || 0).toFixed(2),
    parseFloat(item.paid_amount || 0).toFixed(2),
    item.status
  ]);

  const csvContent = [csvHeaders.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `Invoice_Report_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
</script>
