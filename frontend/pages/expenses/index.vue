<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <v-row class="mb-6 align-center">
      <v-col cols="12" md="6">
        <h1 class="text-h4 font-weight-bold color-primary">
          <v-icon icon="mdi-cash-minus" class="mr-2" color="primary"></v-icon>
          Expense Tracking
        </h1>
        <p class="text-subtitle-1 text-grey-darken-1">Monitor business costs, log bills, and track expenditures</p>
      </v-col>
      <v-col cols="12" md="6" class="d-flex align-center justify-md-end flex-wrap" style="gap: 16px;">
        <v-btn
          v-if="auth.can('settings', 'write')"
          color="secondary"
          prepend-icon="mdi-cog"
          variant="tonal"
          rounded="lg"
          elevation="0"
          height="48"
          class="px-4 font-weight-bold"
          @click="settingsDialog = true"
        >
          Settings
        </v-btn>
        <v-btn
          v-if="auth.can('expenses', 'write')"
          color="primary"
          prepend-icon="mdi-plus"
          rounded="lg"
          elevation="2"
          height="48"
          class="px-8 font-weight-bold"
          @click="openAddDialog"
        >
          Add New Expense
        </v-btn>
      </v-col>
    </v-row>

    <!-- Stats & Filters Bar -->
    <v-row class="mb-6">
      <v-col cols="12" md="3">
        <v-card class="pa-4 border rounded-xl" border variant="flat">
          <div class="text-caption text-uppercase font-weight-bold opacity-60 mb-1">Total Expenses</div>
          <div class="text-h5 font-weight-bold color-primary">AED {{ expenseStore.totalSpent.toFixed(2) }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-4 border rounded-xl" border variant="flat">
          <div class="text-caption text-uppercase font-weight-bold opacity-60 mb-1">Total Paid</div>
          <div class="text-h5 font-weight-bold text-success">AED {{ stats.paid.toFixed(2) }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-4 border rounded-xl" border variant="flat">
          <div class="text-caption text-uppercase font-weight-bold opacity-60 mb-1">Total Unpaid</div>
          <div class="text-h5 font-weight-bold text-error">AED {{ stats.unpaid.toFixed(2) }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
      </v-col>
    </v-row>

    <!-- Filters Row -->
    <v-row class="mb-6">
      <v-col cols="12">
        <v-card class="pa-4 border rounded-xl" border variant="flat">
          <v-row dense>
            <v-col cols="12" md="5">
              <v-text-field
                v-model="search"
                label="Search Description"
                prepend-inner-icon="mdi-magnify"
                hide-details
                density="comfortable"
                variant="outlined"
              ></v-text-field>
            </v-col>
            <v-col cols="6" md="3">
              <v-select
                v-model="statusFilter"
                :items="['All', 'Paid', 'Unpaid', 'Partially Paid']"
                label="Status"
                hide-details
                density="comfortable"
                variant="outlined"
              ></v-select>
            </v-col>
             <v-col cols="6" md="4">
              <v-select
                v-model="categoryFilter"
                :items="['All', 'Office Rent', 'Utilities', 'Salaries', 'Marketing', 'Software/SaaS', 'Government Fees', 'Supplies', 'Travel', 'Other']"
                label="Category"
                hide-details
                density="comfortable"
                variant="outlined"
              ></v-select>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>

    <!-- Expenses Table -->
    <v-card class="border rounded-xl" border>
      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="expenseStore.expenses"
        :items-length="expenseStore.totalItems"
        :loading="expenseStore.loading"
        @update:options="loadExpenses"
        hover
      >
        <!-- Status Chip -->
        <template v-slot:item.status="{ item }">
          <v-chip
            :color="item.status === 'Paid' ? 'success' : (item.status === 'Partially Paid' ? 'orange-darken-1' : 'warning')"
            variant="tonal"
            size="small"
            class="font-weight-bold"
            label
          >
            <v-icon start :icon="item.status === 'Paid' ? 'mdi-check-circle' : (item.status === 'Partially Paid' ? 'mdi-cash-clock' : 'mdi-clock-outline')" size="x-small"></v-icon>
            {{ item.status }}
          </v-chip>
        </template>

        <!-- Amount -->
        <template v-slot:item.amount="{ item }">
          <div class="text-right">
            <span class="font-weight-bold">AED {{ parseFloat(item.amount).toFixed(2) }}</span>
            <div v-if="parseFloat(item.paid_amount) > 0" class="text-caption text-success">
              Paid: AED {{ parseFloat(item.paid_amount).toFixed(2) }}
            </div>
          </div>
        </template>

        <!-- Pending -->
        <template v-slot:item.pending="{ item }">
          <span :class="parseFloat(item.amount) - parseFloat(item.paid_amount) > 0 ? 'text-error font-weight-bold' : 'text-success'">
            AED {{ (parseFloat(item.amount) - parseFloat(item.paid_amount)).toFixed(2) }}
          </span>
        </template>

        <!-- Category -->
        <template v-slot:item.category="{ item }">
          <div class="d-flex flex-column gap-1 align-start">
            <v-chip size="x-small" variant="outlined" color="primary-light">
              {{ item.SubType?.ParentType?.type_name || 'Uncategorized' }}
            </v-chip>
            <div v-if="item.SubType" class="text-caption text-grey">
              {{ item.SubType.sub_type_name }}
            </div>
          </div>
        </template>

        <!-- Date -->
        <template v-slot:item.created_at="{ item }">
            {{ formatDate(item.created_at) }}
        </template>

        <!-- Actions -->
        <template v-slot:item.actions="{ item }">
          <v-menu location="bottom end">
            <template v-slot:activator="{ props }">
              <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="props"></v-btn>
            </template>
            <v-list density="compact" min-width="180">
              <v-list-item 
                v-if="item.status !== 'Paid' && auth.can('expenses', 'write')"
                prepend-icon="mdi-credit-card-check-outline" 
                title="Register Payment" 
                color="success"
                @click="openPayDialog(item)"
              ></v-list-item>
              
              <v-list-item 
                v-if="auth.can('expenses', 'write')"
                prepend-icon="mdi-pencil-outline" 
                title="Edit Details" 
                @click="openEditDialog(item)"
              ></v-list-item>

              <v-divider v-if="item.status === 'Unpaid'"></v-divider>
              
              <v-list-item 
                v-if="item.status === 'Unpaid' && auth.can('expenses', 'delete')"
                prepend-icon="mdi-delete-outline" 
                title="Delete" 
                color="error"
                @click="confirmDelete(item)"
              ></v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Dialogs -->
    <v-dialog v-model="expenseDialog" max-width="700px" persistent>
        <ExpenseDialog 
            v-if="expenseDialog"
            :expense="selectedExpense"
            @save="onExpenseSaved"
            @cancel="expenseDialog = false"
        />
    </v-dialog>

    <v-dialog v-model="payDialog" max-width="450px" persistent>
        <MarkPaidDialog
            v-if="payDialog"
            :expense="selectedExpense"
            :accounts="walletStore.accounts"
            :loading="expenseStore.loading"
            @submit="onPaymentSubmit"
            @cancel="payDialog = false"
        />
    </v-dialog>

    <!-- Settings Dialog -->
    <ExpenseSettingsDialog 
      v-if="settingsDialog"
      v-model="settingsDialog" 
      @saved="onSettingsSaved" 
    />

  </v-container>
</template>

<script setup>
import { useUIStore } from '~/stores/ui'

const uiStore = useUIStore()
import { ref, computed, onMounted, watch } from 'vue';
import { useExpenseStore } from '~/stores/expenses';
import { useWalletStore } from '~/stores/wallet';
import { useAuthStore } from '~/stores/auth';
import ExpenseDialog from '~/components/expenses/ExpenseDialog.vue';
import MarkPaidDialog from '~/components/expenses/MarkPaidDialog.vue';
import ExpenseSettingsDialog from '~/components/expenses/ExpenseSettingsDialog.vue';

const expenseStore = useExpenseStore();
const walletStore = useWalletStore();
const auth = useAuthStore();

// UI State
const search = ref('');
const statusFilter = ref('All');
const categoryFilter = ref('All');
const expenseDialog = ref(false);
const payDialog = ref(false);
const settingsDialog = ref(false);
const selectedExpense = ref(null);
const itemsPerPage = ref(10);
const currentPage = ref(1);

const stats = computed(() => {
    let paid = 0;
    let unpaid = 0;
    expenseStore.expenses.forEach(exp => {
        const total = parseFloat(exp.amount);
        const paidAmt = parseFloat(exp.paid_amount || 0);
        paid += paidAmt;
        unpaid += (total - paidAmt);
    });
    return { paid, unpaid };
});

const headers = [
  { title: 'Date', key: 'created_at' },
  { title: 'Description', key: 'description' },
  { title: 'Category', key: 'category' },
  { title: 'Amount (AED)', key: 'amount', align: 'end' },
  { title: 'Pending', key: 'pending', align: 'end' },
  { title: 'Status', key: 'status', align: 'center' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
];

onMounted(() => {
    walletStore.fetchAccounts();
    // loadExpenses handled by v-data-table-server
});

const loadExpenses = async ({ page, itemsPerPage: limit }) => {
    currentPage.value = page;
    itemsPerPage.value = limit;

    await expenseStore.fetchExpenses({
        page,
        limit,
        status: statusFilter.value === 'All' ? undefined : statusFilter.value,
        category: categoryFilter.value === 'All' ? undefined : categoryFilter.value,
        search: search.value || undefined
    });
};

let searchTimer;
watch([statusFilter, categoryFilter, search], () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        loadExpenses({ page: 1, itemsPerPage: itemsPerPage.value });
    }, 400);
});

const openAddDialog = () => {
    selectedExpense.value = null;
    expenseDialog.value = true;
};

const openEditDialog = (expense) => {
    selectedExpense.value = expense;
    expenseDialog.value = true;
};

const onExpenseSaved = () => {
    expenseDialog.value = false;
    loadExpenses({ page: currentPage.value, itemsPerPage: itemsPerPage.value });
};

const openPayDialog = (expense) => {
    selectedExpense.value = expense;
    payDialog.value = true;
};

const onPaymentSubmit = async (data) => {
    try {
        await expenseStore.payExpense(selectedExpense.value.id, data.account_id, data.payment_date, data.amount);
        payDialog.value = false;
        loadExpenses({ page: currentPage.value, itemsPerPage: itemsPerPage.value });
    } catch (err) {
        uiStore.showError('Payment processing failed');
    }
};

const confirmDelete = async (expense) => {
    if (confirm(`Delete expense: ${expense.description}?`)) {
        await expenseStore.deleteExpense(expense.id);
    }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-GB');
};
</script>
