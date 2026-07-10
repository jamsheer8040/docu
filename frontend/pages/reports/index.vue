<template>
  <v-container fluid class="pa-6">
    <!-- Header & Date Filter -->
    <v-row class="mb-6 align-center">
      <v-col cols="12" md="5">
        <h1 class="text-h4 font-weight-bold color-primary">
          <v-icon icon="mdi-chart-areaspline" class="mr-2" color="primary"></v-icon>
          Insight & Analytics
        </h1>
        <p class="text-subtitle-1 text-grey-darken-1">Analyze business growth, profitability, and cost structures</p>
      </v-col>
      <v-col cols="12" md="7" class="d-flex align-center justify-md-end">
        <div class="d-flex align-center flex-nowrap bg-white pa-1 rounded-lg border shadow-sm" style="gap: 8px; height: 48px;">
          <!-- Preset Selector -->
          <div class="d-flex align-center px-2 border-e">
            <span class="text-caption font-weight-bold text-grey-darken-1 text-uppercase ls-1 mr-2 no-wrap">Period:</span>
            <v-select
              v-model="activePreset"
              :items="presets"
              variant="plain"
              density="compact"
              hide-details
              class="preset-select"
              style="width: 130px;"
              @update:model-value="applyPreset"
            ></v-select>
          </div>

          <!-- Date Range -->
          <div class="d-flex align-center px-1">
            <v-text-field
              v-model="reportStore.filters.from"
              type="date"
              label="From"
              variant="plain"
              density="compact"
              hide-details
              class="px-2 date-input"
              style="width: 130px"
              @update:model-value="activePreset = 'Custom'"
            ></v-text-field>
            <v-divider vertical class="mx-1 ms-2" height="24"></v-divider>
            <v-text-field
              v-model="reportStore.filters.to"
              type="date"
              label="To"
              variant="plain"
              density="compact"
              hide-details
              class="px-2 date-input"
              style="width: 130px"
              @update:model-value="activePreset = 'Custom'"
            ></v-text-field>
          </div>

          <v-btn
            color="primary"
            class="rounded-lg font-weight-bold px-4"
            height="36"
            flat
            @click="refreshData"
            :loading="reportStore.loading"
          >
            Apply
          </v-btn>
        </div>
      </v-col>
    </v-row>

    <!-- Summary Cards -->
    <v-row class="mb-8" align="stretch">
      <v-col cols="12" sm="6" md="3" v-for="(stat, key) in summaryCards" :key="key">
        <v-card class="pa-6 rounded-2xl border h-100" variant="flat">
          <div class="d-flex align-center justify-space-between mb-4">
            <v-avatar :color="stat.bgColor" rounded="lg" size="44" variant="flat">
              <v-icon :icon="stat.icon" :color="stat.iconColor" size="24"></v-icon>
            </v-avatar>
            <div class="text-caption font-weight-bold text-uppercase ls-1 opacity-60">{{ stat.label }}</div>
          </div>
          <div class="text-h4 font-weight-black" :class="stat.colorClass">
              <span v-if="stat.prefix" class="text-body-2 font-weight-medium mr-1">{{ stat.prefix }}</span>
              {{ stat.value }}
              <span v-if="stat.suffix" class="text-body-1 font-weight-medium ml-1">{{ stat.suffix }}</span>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Charts Section -->
    <v-row class="mb-8">
      <!-- Monthly Trends -->
      <v-col cols="12" md="8">
        <v-card class="pa-6 rounded-2xl border bg-surface" border variant="flat">
          <div class="d-flex align-center mb-6">
              <v-icon icon="mdi-trending-up" color="primary" class="mr-2"></v-icon>
              <div class="text-h6 font-weight-bold">Monthly Financial Trends</div>
          </div>
          <client-only>
            <apexchart
                type="bar"
                height="350"
                :options="barChartOptions"
                :series="barChartSeries"
            ></apexchart>
          </client-only>
        </v-card>
      </v-col>

      <!-- Revenue by Service -->
      <v-col cols="12" md="4">
        <v-card class="pa-6 rounded-2xl border bg-surface" border variant="flat">
          <div class="d-flex align-center mb-6">
              <v-icon icon="mdi-chart-donut" color="secondary" class="mr-2"></v-icon>
              <div class="text-h6 font-weight-bold">Revenue Breakdown</div>
          </div>
          <client-only>
            <apexchart
                type="donut"
                height="400"
                :options="donutChartOptions"
                :series="donutChartSeries"
            ></apexchart>
          </client-only>
        </v-card>
      </v-col>
    </v-row>

    <!-- Detailed Leaderboards -->
    <v-row>
        <!-- Top Customers -->
        <v-col cols="12" md="6">
            <v-card class="rounded-2xl border bg-surface overflow-hidden" variant="flat">
                <v-toolbar color="surface" border-b flat class="px-6">
                    <span class="text-h6 font-weight-bold">Top Clients (Revenue)</span>
                </v-toolbar>
                <v-table v-if="reportStore.topCustomers.length">
                    <thead>
                        <tr>
                            <th>Customer Name</th>
                            <th class="text-center">Invoices</th>
                            <th class="text-right">Total Invoiced</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="c in reportStore.topCustomers" :key="c.customer_id">
                            <td class="font-weight-medium">{{ c.Customer?.name }}</td>
                            <td class="text-center">{{ c.invoice_count }}</td>
                            <td class="text-right font-weight-black color-primary">AED {{ parseFloat(c.total_invoiced).toLocaleString() }}</td>
                        </tr>
                    </tbody>
                </v-table>
                <div v-else class="pa-12">
                    <EmptyState 
                        title="No Customer Data" 
                        subtitle="Top customers by revenue will appear here once invoices are paid." 
                        icon="mdi-account-star-outline"
                    />
                </div>
            </v-card>
        </v-col>

        <!-- Expense by Category -->
        <v-col cols="12" md="6">
            <v-card class="rounded-2xl border bg-surface overflow-hidden" variant="flat">
                <v-toolbar color="surface" border-b flat class="px-6">
                    <span class="text-h6 font-weight-bold">Spending by Category</span>
                </v-toolbar>
                <v-table v-if="reportStore.expensesByCategory.length">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th class="text-right">Total Spent</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="e in reportStore.expensesByCategory" :key="e.category">
                            <td class="font-weight-medium">{{ e.category || 'Uncategorized' }}</td>
                            <td class="text-right font-weight-black text-error">AED {{ parseFloat(e.total_amount).toLocaleString() }}</td>
                        </tr>
                    </tbody>
                </v-table>
                <div v-else class="pa-12">
                    <EmptyState 
                        title="No Expense Data" 
                        subtitle="Category-wise spending will appear here once expenses are logged." 
                        icon="mdi-cart-outline"
                    />
                </div>
            </v-card>
        </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useReportStore } from '~/stores/reports';
import EmptyState from '~/components/common/EmptyState.vue';
import dayjs from 'dayjs';

const reportStore = useReportStore();
const activePreset = ref('This Month');
const presets = ['Today', 'This Month', 'Financial Year', 'Custom'];

const applyPreset = (preset) => {
    const today = dayjs();
    let from, to;

    switch (preset) {
        case 'Today':
            from = today.format('YYYY-MM-DD');
            to = today.format('YYYY-MM-DD');
            break;
        case 'This Month':
            from = today.startOf('month').format('YYYY-MM-DD');
            to = today.format('YYYY-MM-DD');
            break;
        case 'Financial Year':
            // Financial Year: Jan 1 to Dec 31
            from = today.startOf('year').format('YYYY-MM-DD');
            to = today.endOf('year').format('YYYY-MM-DD');
            break;
        default:
            return; // Custom logic handled by text fields
    }

    reportStore.filters.from = from;
    reportStore.filters.to = to;
    refreshData();
};

const summaryCards = computed(() => ({
    revenue: { 
        label: 'Total Revenue', 
        value: reportStore.summary.total_revenue.toLocaleString(), 
        prefix: 'AED', 
        colorClass: 'text-success',
        icon: 'mdi-database-import',
        iconColor: 'success',
        bgColor: 'green-lighten-5'
    },
    cost: { 
        label: 'Total Cost', 
        value: reportStore.summary.total_cost.toLocaleString(), 
        prefix: 'AED', 
        colorClass: 'text-error',
        icon: 'mdi-database-export',
        iconColor: 'error',
        bgColor: 'red-lighten-5'
    },
    profit: { 
        label: 'Net Profit', 
        value: reportStore.summary.net_profit.toLocaleString(), 
        prefix: 'AED', 
        colorClass: 'color-primary',
        icon: 'mdi-bank-outline',
        iconColor: 'primary',
        bgColor: 'blue-lighten-5'
    },
    margin: { 
        label: 'Profit Margin', 
        value: reportStore.summary.profit_margin.toFixed(1), 
        suffix: '%', 
        colorClass: 'text-secondary',
        icon: 'mdi-percent',
        iconColor: 'secondary',
        bgColor: 'deep-purple-lighten-5'
    }
}));

// Chart Configurations
const barChartOptions = computed(() => ({
    chart: { id: 'monthly-trends', toolbar: { show: false } },
    xaxis: { categories: reportStore.trends.labels },
    colors: ['#0B57D0', '#D32F2F'], // Primary vs Error
    plotOptions: { bar: { borderRadius: 6, columnWidth: '50%' } },
    dataLabels: { enabled: false },
    legend: { position: 'top' }
}));

const barChartSeries = computed(() => [
    { name: 'Revenue', data: reportStore.trends.revenue },
    { name: 'Cost', data: reportStore.trends.cost }
]);

const donutChartOptions = computed(() => ({
    labels: reportStore.revenueByService.map(s => s.description || 'Other'),
    legend: { 
        position: 'bottom',
        offsetY: 0,
        padding: 20
    },
    colors: ['#0B57D0', '#1A73E8', '#4285F4', '#8AB4F8', '#ADCCFF'],
    stroke: { show: false },
    plotOptions: {
        pie: {
            donut: {
                labels: {
                    show: true,
                    total: {
                        show: true,
                        label: 'Total Revenue',
                        labelStyle: {
                            color: '#616161',
                            fontSize: '14px',
                            fontWeight: '600'
                        },
                        formatter: (w) => {
                            const total = w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                            return 'AED ' + total.toLocaleString();
                        }
                    }
                }
            }
        }
    },
    dataLabels: {
        enabled: true,
        formatter: (val) => `${val.toFixed(1)}%`
    }
}));

const donutChartSeries = computed(() => 
    reportStore.revenueByService.map(s => parseFloat(s.total_revenue))
);

onMounted(() => {
    refreshData();
});

const refreshData = () => {
    reportStore.fetchAllReports();
};
</script>

<style scoped>
.color-on-surface {
    color: rgba(0,0,0,0.8);
}
.no-wrap {
  white-space: nowrap;
}
.preset-select :deep(.v-field__input) {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  min-height: 32px !important;
  font-size: 0.875rem;
}
.date-input :deep(.v-field__input) {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  min-height: 32px !important;
  font-size: 0.875rem;
}
</style>
