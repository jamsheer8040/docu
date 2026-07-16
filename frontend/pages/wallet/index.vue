<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <v-row class="mb-6 align-center">
      <v-col cols="12" md="6">
        <h1 class="text-h4 font-weight-bold color-primary">
          <v-icon icon="mdi-wallet-outline" class="mr-2" color="primary"></v-icon>
          Wallet & Accounts
        </h1>
        <p class="text-subtitle-1 text-grey-darken-1">Monitor company liquidity and inter-account movements</p>
      </v-col>
      <v-col cols="12" md="6" class="d-flex align-center justify-md-end flex-wrap" style="gap: 16px;">
        <v-btn
          v-if="auth.can('wallet', 'write')"
          color="success"
          prepend-icon="mdi-plus"
          rounded="lg"
          elevation="2"
          height="48"
          class="px-8 font-weight-bold"
          @click="openAddWallet"
        >
          Add Wallet
        </v-btn>
        <v-btn
          v-if="auth.can('wallet', 'write')"
          color="primary"
          prepend-icon="mdi-swap-horizontal"
          rounded="lg"
          elevation="2"
          height="48"
          class="px-8 font-weight-bold"
          @click="showTransferDialog = true"
        >
          Internal Transfer
        </v-btn>
      </v-col>
    </v-row>

    <!-- Summary Statistics Cards row -->
    <v-row class="mb-8">
      <v-col cols="12" md="3">
        <v-card class="pa-6 glass-card d-flex flex-column justify-center align-center" height="100%">
          <div class="text-subtitle-2 text-uppercase font-weight-black opacity-60 mb-2">Total Cash</div>
          <div class="text-h5 font-weight-black text-primary">AED {{ summaryStats.cash.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-6 glass-card d-flex flex-column justify-center align-center" height="100%">
          <div class="text-subtitle-2 text-uppercase font-weight-black opacity-60 mb-2">Total Bank</div>
          <div class="text-h5 font-weight-black text-primary">AED {{ summaryStats.bank.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card class="pa-6 glass-card d-flex flex-column justify-center align-center position-relative overflow-hidden" height="100%">
          <div class="card-glow" style="background: rgba(67, 24, 255, 0.04); position: absolute; inset: 0;"></div>
          <div class="text-subtitle-1 text-uppercase font-weight-black opacity-70 mb-2" style="z-index: 1;">Grand Total Liquidity</div>
          <div class="text-h3 font-weight-black text-primary" style="z-index: 1;">AED {{ summaryStats.grand_total.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}</div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Detailed Account Breakdown -->
    <v-row class="mb-8">
      <v-col v-for="account in walletStore.accounts" :key="account.id" cols="12" sm="6" md="3">
        <v-card variant="flat" class="pa-4 rounded-xl border bg-surface account-card position-relative overflow-hidden">
          <div class="card-glow" :style="`background: ${account.balance < 0 ? 'rgba(186, 26, 26, 0.05)' : 'rgba(0, 107, 45, 0.05)'}`"></div>
          
          <div class="d-flex align-center justify-space-between mb-3">
            <div class="account-icon-wrapper-small rounded-lg" :class="account.name.toLowerCase().includes('cash') ? 'bg-primary-container' : 'bg-secondary-container'">
                <v-icon size="small" :color="account.name.toLowerCase().includes('cash') ? 'primary' : 'secondary'">
                    {{ account.name.toLowerCase().includes('cash') ? 'mdi-cash-multiple' : 'mdi-bank' }}
                </v-icon>
            </div>
            <div class="d-flex align-center gap-1">
              <v-chip size="x-small" :color="account.balance < 0 ? 'error' : 'success'" class="font-weight-bold" style="font-size: 10px; height: 18px;">
                  {{ account.balance < 0 ? 'DEBT' : 'POSITIVE' }}
              </v-chip>
              <v-btn
                v-if="auth.can('wallet', 'write')"
                icon="mdi-pencil"
                variant="text"
                size="x-small"
                color="grey-darken-1"
                @click="openEditWallet(account)"
                title="Edit Wallet Name"
              ></v-btn>
            </div>
          </div>

          <div class="text-caption font-weight-bold opacity-60 text-uppercase mb-1">{{ account.name }}</div>
          <div class="text-h6 font-weight-black mb-3">
              <span class="text-caption font-weight-medium opacity-50 mr-1">AED</span>
              {{ account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
          </div>

          <v-divider class="mb-3 opacity-10"></v-divider>
          
          <div class="d-flex align-center justify-space-between">
              <span class="text-caption opacity-60" style="font-size: 11px !important;">Status: {{ account.is_active ? 'Active' : 'Archived' }}</span>
              <v-btn variant="text" size="x-small" color="primary" class="font-weight-bold px-0" @click="filterByAccount(account.id)">VIEW LEDGER</v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Ledger Section -->
    <v-card class="border rounded-2xl" border>
      <v-toolbar color="surface" flat border-b class="px-4">
          <v-icon icon="mdi-format-list-bulleted" color="primary" class="mr-3"></v-icon>
          <span class="text-h6 font-weight-bold">Detailed Financial Ledger</span>
          <v-spacer></v-spacer>
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            placeholder="Search transactions..."
            variant="solo-filled"
            density="compact"
            flat
            hide-details
            class="max-width-300 rounded-pill ledger-search"
          ></v-text-field>
      </v-toolbar>

      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="walletStore.transactions"
        :items-length="walletStore.meta.total"
        :loading="walletStore.loading"
        @update:options="loadTransactions"
        hover
      >
        <!-- Date formatting -->
        <template v-slot:item.created_at="{ item }">
          <div class="d-flex flex-column">
              <span class="font-weight-medium">{{ formatDate(item.created_at) }}</span>
              <span class="text-overline opacity-40">{{ formatTime(item.created_at) }}</span>
          </div>
        </template>
        
        <!-- Account tag -->
        <template v-slot:item.WalletAccount="{ item }">
          <v-chip size="small" variant="tonal" color="primary" density="compact" class="font-weight-bold px-3">
              {{ item.WalletAccount?.name }}
          </v-chip>
        </template>

        <!-- Transaction Type -->
        <template v-slot:item.type="{ item }">
           <v-chip :color="getTypeColor(item.type)" size="x-small" label class="text-uppercase font-weight-black">
             {{ item.type }}
           </v-chip>
        </template>

        <!-- Amount with direction -->
        <template v-slot:item.amount="{ item }">
          <div class="text-right d-flex flex-column">
              <span :class="item.direction === 'In' ? 'text-success font-weight-black' : 'text-error font-weight-black'">
                {{ item.direction === 'In' ? '+' : '-' }} AED {{ parseFloat(item.amount).toLocaleString('en-US', { minimumFractionDigits: 2 }) }}
              </span>
              <span class="text-overline opacity-30">{{ item.direction === 'In' ? 'INFLOW' : 'OUTFLOW' }}</span>
          </div>
        </template>

        <!-- Reference Logic -->
        <template v-slot:item.reference="{ item }">
           <v-btn 
            v-if="item.reference_id" 
            variant="tonal" 
            size="x-small" 
            color="primary" 
            class="px-3 rounded-pill"
            :to="getReferenceRoute(item)"
           >
             {{ item.reference_type }} #{{ item.reference_id }}
           </v-btn>
           <span v-else class="text-caption opacity-40 italic font-mono px-2">SYSTEM_ENTRY</span>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Transfer Dialog Component -->
    <TransferDialog
      v-model="showTransferDialog"
      :accounts="walletStore.accounts"
      @success="onTransferSuccess"
    />

    <!-- Add / Edit Wallet Dialog -->
    <v-dialog v-model="walletDialog" max-width="500px">
      <v-card class="rounded-xl border">
        <v-toolbar color="surface" flat border-b>
          <v-toolbar-title class="font-weight-bold">{{ editingWallet ? 'Edit Wallet' : 'Add Wallet' }}</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" variant="text" @click="walletDialog = false"></v-btn>
        </v-toolbar>
        <v-card-text class="pt-6">
          <v-form ref="walletForm" v-model="walletFormValid" @submit.prevent="saveWallet">
            <v-text-field
              v-model="walletData.name"
              label="Wallet Name *"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || 'Name is required']"
              required
            ></v-text-field>
            <v-text-field
              v-model="walletData.description"
              label="Description (Optional)"
              variant="outlined"
              density="comfortable"
              class="mt-2"
            ></v-text-field>
            <v-text-field
              v-if="!editingWallet"
              v-model.number="walletData.opening_balance"
              label="Opening Balance (Optional)"
              type="number"
              min="0"
              step="0.01"
              variant="outlined"
              density="comfortable"
              class="mt-2"
              prefix="AED"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4 border-t">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="walletDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" class="px-6" @click="saveWallet" :loading="walletSaving">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="successSnackbar" color="success" timeout="3000" location="top" variant="flat">
       <v-icon start icon="mdi-check-circle-outline"></v-icon>
       {{ snackbarMessage }}
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useWalletStore } from '@/stores/wallet';
import { useAuthStore } from '@/stores/auth';
import TransferDialog from '@/components/wallet/TransferDialog.vue';
import dayjs from 'dayjs';

const walletStore = useWalletStore();
const auth = useAuthStore();
const showTransferDialog = ref(false);
const successSnackbar = ref(false);
const snackbarMessage = ref('');
const search = ref('');
const itemsPerPage = ref(10);
const accountFilter = ref(null);

const walletDialog = ref(false);
const editingWallet = ref(null);
const walletSaving = ref(false);
const walletFormValid = ref(false);
const walletForm = ref(null);
const walletData = ref({ name: '', description: '' });

const headers = [
  { title: 'Date / Time', key: 'created_at', sortable: false },
  { title: 'Account', key: 'WalletAccount', sortable: false },
  { title: 'Type', key: 'type', sortable: false },
  { title: 'Description', key: 'description', sortable: false },
  { title: 'Amount (AED)', key: 'amount', sortable: false, align: 'end' },
  { title: 'Source Reference', key: 'reference', sortable: false, align: 'end' }
];

// Summary Statistics Computation
const summaryStats = computed(() => {
    let cash = 0;
    let bank = 0;
    walletStore.accounts.forEach(acc => {
        const bal = parseFloat(acc.balance || 0);
        if (acc.name.toLowerCase().includes('cash')) cash += bal;
        else bank += bal;
    });
    return { cash, bank, grand_total: cash + bank };
});

onMounted(() => {
  walletStore.fetchAccounts();
  walletStore.fetchSummary();
});

const loadTransactions = ({ page, itemsPerPage }) => {
  walletStore.fetchTransactions({
    page,
    limit: itemsPerPage,
    search: search.value,
    account_id: accountFilter.value
  });
};

watch(search, () => {
    loadTransactions({ page: 1, itemsPerPage: itemsPerPage.value });
});

const filterByAccount = (id) => {
    accountFilter.value = id;
    loadTransactions({ page: 1, itemsPerPage: itemsPerPage.value });
};

const onTransferSuccess = () => {
  snackbarMessage.value = 'Internal transfer completed successfully.';
  successSnackbar.value = true;
  loadTransactions({ page: 1, itemsPerPage: itemsPerPage.value });
};

const openAddWallet = () => {
  editingWallet.value = null;
  walletData.value = { name: '', description: '', opening_balance: 0 };
  walletDialog.value = true;
};

const openEditWallet = (account) => {
  editingWallet.value = account;
  walletData.value = { name: account.name, description: account.description || '' };
  walletDialog.value = true;
};

const saveWallet = async () => {
  const { valid } = await walletForm.value.validate();
  if (!valid) return;

  walletSaving.value = true;
  try {
    const payload = { ...walletData.value };
    let res;
    if (editingWallet.value) {
      res = await walletStore.updateAccount(editingWallet.value.id, payload);
    } else {
      res = await walletStore.createAccount(payload);
    }

    if (res.success) {
      snackbarMessage.value = editingWallet.value ? 'Wallet updated successfully.' : 'Wallet created successfully.';
      successSnackbar.value = true;
      walletDialog.value = false;
    } else {
      alert(res.message || 'Failed to save wallet');
    }
  } catch (error) {
    console.error(error);
  } finally {
    walletSaving.value = false;
  }
};

const formatDate = (date) => dayjs(date).format('DD MMM YYYY');
const formatTime = (date) => dayjs(date).format('hh:mm A');

const getTypeColor = (type) => {
  switch (type) {
    case 'Income': return 'success';
    case 'Expense': return 'error';
    case 'Transfer': return 'info';
    case 'Manual': return 'grey-darken-1';
    default: return 'grey';
  }
};

const getReferenceRoute = (item) => {
    if (item.reference_type === 'Invoice') return `/invoices`;
    if (item.reference_type === 'Expense') return `/expenses`;
    return null;
};
</script>

<style scoped>
.max-width-300 {
  max-width: 300px;
}
.account-card {
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s;
    cursor: default;
}
.account-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 32px -4px rgba(0,0,0,0.12) !important;
}
.account-icon-wrapper {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.account-icon-wrapper-small {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
}
.card-glow {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    pointer-events: none;
}
.ledger-search :deep(.v-field__input) {
    padding-top: 8px !important;
    padding-bottom: 8px !important;
}
</style>
