<template>
  <div>
    <div class="d-flex justify-space-between align-center mb-4">
      <div class="text-h6 font-weight-bold">Capital Transactions</div>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openDialog">Record Transaction</v-btn>
    </div>

    <v-card class="border rounded-xl" border>
      <v-data-table
        :headers="headers"
        :items="store.capitalTransactions"
        :loading="store.loading"
        hover
      >
        <template v-slot:item.date="{ item }">
          {{ formatDate(item.date) }}
        </template>
        <template v-slot:item.Shareholder="{ item }">
          <div class="font-weight-bold">{{ item.Shareholder?.name }}</div>
        </template>
        <template v-slot:item.type="{ item }">
          <v-chip :color="item.type === 'Contribution' || item.type === 'Advance' ? 'success' : 'error'" size="small">{{ item.type }}</v-chip>
        </template>
        <template v-slot:item.amount="{ item }">
          <span class="font-weight-bold">{{ formatCurrency(item.amount) }}</span>
        </template>
        <template v-slot:item.WalletAccount="{ item }">
          {{ item.WalletAccount?.name || '-' }}
        </template>
      </v-data-table>
    </v-card>

    <!-- Dialog -->
    <v-dialog v-model="dialog" max-width="600">
      <v-card class="rounded-xl border">
        <v-card-title class="pa-4 border-b bg-grey-lighten-4">
          <span class="text-h6 font-weight-bold">Record Capital Transaction</span>
        </v-card-title>
        <v-card-text class="pa-4">
          <v-form ref="form" v-model="valid">
            <v-select v-model="newItem.shareholder_id" :items="store.shareholders" item-title="name" item-value="id" label="Shareholder*" variant="outlined" density="comfortable" :rules="[v => !!v || 'Required']" class="mb-2"></v-select>
            <v-select v-model="newItem.type" :items="['Contribution', 'Refund', 'Advance', 'Adjustment']" label="Transaction Type*" variant="outlined" density="comfortable" :rules="[v => !!v || 'Required']" class="mb-2"></v-select>
            <v-text-field v-model.number="newItem.amount" label="Amount (AED)*" type="number" variant="outlined" density="comfortable" :rules="[v => v > 0 || 'Invalid']" class="mb-2"></v-text-field>
            
            <v-row>
              <v-col cols="6">
                <v-text-field v-model="newItem.date" label="Date*" type="date" variant="outlined" density="comfortable" :rules="[v => !!v || 'Required']" class="mb-2"></v-text-field>
              </v-col>
              <v-col cols="6">
                <v-select v-model="newItem.method" :items="['Bank Transfer', 'Cash', 'Cheque', 'Online', 'Other']" label="Payment Method" variant="outlined" density="comfortable" class="mb-2"></v-select>
              </v-col>
            </v-row>
            
            <v-select v-model="newItem.wallet_id" :items="walletStore.accounts" item-title="name" item-value="id" label="Deposit To / Withdraw From Wallet" variant="outlined" density="comfortable" class="mb-2" persistent-hint hint="Will automatically update wallet balance"></v-select>
            <v-text-field v-model="newItem.reference_number" label="Reference / Cheque Number" variant="outlined" density="comfortable" class="mb-2"></v-text-field>
            <v-textarea v-model="newItem.remarks" label="Remarks" variant="outlined" density="comfortable" rows="2"></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4 border-t">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" :disabled="!valid || saving" :loading="saving" @click="save">Save Transaction</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useManagementStore } from '~/stores/management';
import { useWalletStore } from '~/stores/wallet';

const store = useManagementStore();
const walletStore = useWalletStore();

const dialog = ref(false);
const valid = ref(false);
const saving = ref(false);
const newItem = ref({ type: 'Contribution', date: new Date().toISOString().substr(0, 10) });

const headers = [
  { title: 'Date', key: 'date' },
  { title: 'Shareholder', key: 'Shareholder' },
  { title: 'Type', key: 'type', align: 'center' },
  { title: 'Amount', key: 'amount', align: 'end' },
  { title: 'Method', key: 'method' },
  { title: 'Wallet/Bank', key: 'WalletAccount' },
  { title: 'Ref', key: 'reference_number' }
];

const formatCurrency = (val) => {
  if (!val) return '0.00';
  return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString();
};

const openDialog = () => {
  newItem.value = { type: 'Contribution', date: new Date().toISOString().substr(0, 10) };
  dialog.value = true;
};

const save = async () => {
  if (!valid.value) return;
  saving.value = true;
  try {
    await store.createCapitalTransaction(newItem.value);
    dialog.value = false;
  } catch (err) {
    alert(err.response?.data?.message || 'Error saving transaction');
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  store.fetchCapitalTransactions();
  if (!store.shareholders.length) store.fetchShareholders();
  if (!walletStore.accounts.length) walletStore.fetchAccounts();
});
</script>
