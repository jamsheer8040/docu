<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <v-row class="mb-6 align-center">
      <v-col cols="12" md="6">
        <h1 class="text-h4 font-weight-bold color-primary">
          <v-icon icon="mdi-receipt-outline" class="mr-2" color="primary"></v-icon>
          Invoices & Billing
        </h1>
        <p class="text-subtitle-1 text-grey-darken-1">Manage client billing, track payments, and generate PDFs</p>
      </v-col>
      <v-col cols="12" md="6" class="d-flex align-center justify-md-end flex-wrap" style="gap: 16px;">
        <v-btn
          v-if="auth.can('invoices', 'write')"
          color="primary"
          prepend-icon="mdi-plus"
          rounded="lg"
          elevation="2"
          height="48"
          class="px-8 font-weight-bold"
          @click="openCreateDialog"
        >
          Create Invoice
        </v-btn>
      </v-col>
    </v-row>

    <!-- Filters & Stats Bar -->
    <v-row class="mb-6">
      <v-col cols="12" md="3">
        <v-card class="pa-4 border" border variant="flat">
          <div class="text-caption text-uppercase font-weight-bold opacity-60 mb-1">Total Outstanding</div>
          <div class="text-h5 font-weight-bold text-error">AED {{ stats.outstanding.toFixed(2) }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-4 border" border variant="flat">
          <div class="text-caption text-uppercase font-weight-bold opacity-60 mb-1">Received (Total)</div>
          <div class="text-h5 font-weight-bold text-success">AED {{ stats.received.toFixed(2) }}</div>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
         <v-row dense>
           <v-col cols="6">
             <v-text-field
                v-model="search"
                label="Search Invoice # or Customer"
                prepend-inner-icon="mdi-magnify"
                hide-details
                density="comfortable"
                variant="outlined"
             ></v-text-field>
           </v-col>
           <v-col cols="6">
             <v-select
                v-model="statusFilter"
                :items="['All', 'Draft', 'Issued', 'Partially Paid', 'Paid', 'Cancelled']"
                label="Status Filter"
                hide-details
                density="comfortable"
                variant="outlined"
             ></v-select>
           </v-col>
         </v-row>
      </v-col>
    </v-row>

    <!-- Invoices Table -->
    <v-card class="border" border>
      <v-data-table-server
        v-model:items-per-page="itemsPerPage"
        :headers="headers"
        :items="invoiceStore.invoices"
        :items-length="invoiceStore.totalInvoices"
        :loading="invoiceStore.loading"
        @update:options="loadInvoices"
        hover
      >
        <!-- Invoice Number -->
        <template v-slot:item.invoice_number="{ item }">
          <span class="font-weight-bold text-high-emphasis cursor-pointer" @click="viewInvoice(item)">
            {{ item.invoice_number }}
          </span>
        </template>

        <!-- Customer -->
        <template v-slot:item.Customer="{ item }">
          <div>
            <div class="font-weight-medium">{{ item.Customer?.name }}</div>
            <div class="text-caption opacity-60">{{ item.Customer?.phone_whatsapp }}</div>
          </div>
        </template>

        <!-- Dates -->
        <template v-slot:item.created_at="{ item }">{{ formatDate(item.created_at) }}</template>

        <!-- Total -->
        <template v-slot:item.total="{ item }">
          <div class="text-right">
            <span class="font-weight-bold">AED {{ parseFloat(item.total).toFixed(2) }}</span>
            <div v-if="parseFloat(item.paid_amount) > 0" class="text-caption text-success">
              Paid: AED {{ parseFloat(item.paid_amount).toFixed(2) }}
            </div>
          </div>
        </template>

        <!-- Pending -->
        <template v-slot:item.pending="{ item }">
          <span :class="parseFloat(item.total) - parseFloat(item.paid_amount) > 0 ? 'text-error font-weight-bold' : 'text-success'">
            AED {{ (parseFloat(item.total) - parseFloat(item.paid_amount)).toFixed(2) }}
          </span>
        </template>

        <!-- Status -->
        <template v-slot:item.status="{ item }">
          <InvoiceStatusChip :status="item.status" />
        </template>

        <!-- Actions -->
        <template v-slot:item.actions="{ item }">
          <v-menu location="bottom end">
            <template v-slot:activator="{ props }">
              <v-btn icon="mdi-dots-vertical" variant="text" size="small" v-bind="props"></v-btn>
            </template>
            <v-list density="compact" width="200">
              <v-list-item 
                v-if="item.status === 'Draft' && auth.can('invoices', 'write')"
                prepend-icon="mdi-pencil-outline" 
                title="Edit Invoice" 
                @click="editInvoice(item)"
              ></v-list-item>

              <v-list-item 
                v-if="item.status === 'Draft' && auth.can('invoices', 'write')"
                prepend-icon="mdi-send-check-outline" 
                title="Issue Invoice" 
                @click="updateStatus(item, 'Issued')"
              ></v-list-item>
              
              <v-list-item 
                prepend-icon="mdi-file-pdf-box" 
                title="Download PDF" 
                @click="downloadPDF(item)"
              ></v-list-item>

              <v-list-item 
                v-if="item.status === 'Issued' || item.status === 'Partially Paid'"
                prepend-icon="mdi-credit-card-plus-outline" 
                title="Collect Payment" 
                color="success"
                @click="openPayDialog(item)"
              ></v-list-item>



              <v-divider v-if="item.status !== 'Cancelled'"></v-divider>
              
              <v-list-item 
                v-if="item.status !== 'Cancelled' && auth.can('invoices', 'delete')"
                prepend-icon="mdi-cancel" 
                title="Cancel Invoice" 
                color="error"
                @click="confirmCancel(item)"
              ></v-list-item>
            </v-list>
          </v-menu>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- Dialogs -->
    <v-dialog v-model="viewDialog" max-width="900px">
        <InvoiceDetailView 
            v-if="viewDialog" 
            :invoice-id="selectedInvoice?.id" 
            @close="viewDialog = false" 
        />
    </v-dialog>

    <v-dialog v-model="payDialog" max-width="450px" persistent>
        <v-card class="pa-4 rounded-xl">
            <v-card-title class="text-h6 font-weight-bold d-flex align-center">
                <v-icon icon="mdi-cash-register" class="mr-2" color="success"></v-icon>
                Collect Payment
            </v-card-title>
            <v-card-text>
                <div class="mb-6 pa-4 bg-grey-lighten-4 rounded-lg border">
                  <v-row dense>
                    <v-col cols="6">
                      <div class="text-caption text-uppercase font-weight-bold opacity-60 mb-1">Total</div>
                      <div class="font-weight-bold text-primary">AED {{ parseFloat(selectedInvoice?.total || 0).toFixed(2) }}</div>
                    </v-col>
                    <v-col cols="6">
                      <div class="text-caption text-uppercase font-weight-bold opacity-60 mb-1">Due</div>
                      <div class="font-weight-bold text-error">AED {{ (parseFloat(selectedInvoice?.total || 0) - parseFloat(selectedInvoice?.paid_amount || 0)).toFixed(2) }}</div>
                    </v-col>
                  </v-row>
                </div>

                <v-text-field
                    v-model="paymentAmount"
                    label="Amount to Collect"
                    prefix="AED"
                    variant="outlined"
                    density="comfortable"
                    type="number"
                    hide-details
                    class="mb-4"
                ></v-text-field>

                <v-select
                    v-model="paymentAccount"
                    :items="walletStore.accounts"
                    item-title="name"
                    item-value="id"
                    label="Deposit Into Account"
                    placeholder="Select Bank or Cash"
                    variant="outlined"
                    density="comfortable"
                    :loading="walletStore.loading"
                    hide-details
                ></v-select>
            </v-card-text>
            <v-card-actions class="px-4 pb-4">
                <v-spacer></v-spacer>
                <v-btn variant="text" @click="payDialog = false">Cancel</v-btn>
                <v-btn 
                    color="success" 
                    variant="flat" 
                    :disabled="!paymentAccount || !paymentAmount" 
                    @click="confirmPayment"
                    :loading="invoiceStore.loading"
                    class="rounded-pill px-6"
                >
                    Confirm Collection
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <!-- Invoice Design Dialog (Manual Creation) -->
    <v-dialog v-model="invoiceDialog" max-width="90vw" persistent>
        <InvoiceDialog 
            v-if="invoiceDialog"
            :invoice="editableInvoice"
            @save="onInvoiceSaved"
            @cancel="invoiceDialog = false"
        />
    </v-dialog>

  </v-container>
</template>

<script setup>
import { useUIStore } from '~/stores/ui'

const uiStore = useUIStore()
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useInvoiceStore } from '~/stores/invoices';
import { useWalletStore } from '~/stores/wallet';
import InvoiceStatusChip from '~/components/invoices/InvoiceStatusChip.vue';
import InvoiceDetailView from '~/components/invoices/InvoiceDetailView.vue';
import InvoiceDialog from '~/components/invoices/InvoiceDialog.vue';
import { useWhatsApp } from '~/composables/useWhatsApp';
import { useAuthStore } from '~/stores/auth';

const invoiceStore = useInvoiceStore();
const walletStore = useWalletStore();
const auth = useAuthStore();
const { openWhatsApp, MESSAGES } = useWhatsApp();

// UI State
const search = ref('');
const statusFilter = ref('All');
const itemsPerPage = ref(10);
const currentPage = ref(1);
const viewDialog = ref(false);
const payDialog = ref(false);
const invoiceDialog = ref(false);
const selectedInvoice = ref(null);
const editableInvoice = ref(null);
const paymentAccount = ref(null);
const paymentAmount = ref(0);

const headers = [
  { title: 'Invoice #', key: 'invoice_number' },
  { title: 'Customer', key: 'Customer' },
  { title: 'Date', key: 'created_at' },
  { title: 'Total', key: 'total', align: 'end' },
  { title: 'Pending', key: 'pending', align: 'end' },
  { title: 'Status', key: 'status', align: 'center' },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' },
];

const stats = computed(() => {
    let outstanding = 0;
    let received = 0;
    invoiceStore.invoices.forEach(inv => {
        const total = parseFloat(inv.total);
        const paid = parseFloat(inv.paid_amount || 0);
        if (inv.status !== 'Cancelled') {
            outstanding += (total - paid);
        }
        received += paid;
    });
    return { outstanding, received };
});

const loadInvoices = async ({ page, itemsPerPage: limit, search: searchQuery }) => {
    currentPage.value = page;
    itemsPerPage.value = limit;
    
    await invoiceStore.fetchInvoices({
        page,
        limit,
        status: statusFilter.value === 'All' ? undefined : statusFilter.value,
        search: search.value || undefined
    });
};

onMounted(() => {
    // fetchData is now handled by v-data-table-server @update:options
});

let searchTimer;
watch([search, statusFilter], () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
        loadInvoices({ page: 1, itemsPerPage: itemsPerPage.value });
    }, 400);
});

const viewInvoice = (invoice) => {
    selectedInvoice.value = invoice;
    viewDialog.value = true;
};

const openCreateDialog = () => {
    editableInvoice.value = null;
    invoiceDialog.value = true;
};

const editInvoice = (invoice) => {
    editableInvoice.value = invoice;
    invoiceDialog.value = true;
};

const onInvoiceSaved = () => {
    invoiceDialog.value = false;
    invoiceStore.fetchInvoices();
};

const openPayDialog = (invoice) => {
    selectedInvoice.value = invoice;
    paymentAmount.value = parseFloat(invoice.total) - parseFloat(invoice.paid_amount || 0);
    walletStore.fetchAccounts(); // Ensure accounts are loaded for the dropdown
    payDialog.value = true;
};

const updateStatus = async (invoice, newStatus) => {
    try {
        await invoiceStore.updateStatus(invoice.id, newStatus);
        loadInvoices({ page: currentPage.value, itemsPerPage: itemsPerPage.value, search: search.value });
    } catch (err) {
        uiStore.showError('Failed to update status');
    }
};

const confirmPayment = async () => {
    if (!paymentAccount.value || !paymentAmount.value) return;
    try {
        await invoiceStore.updateStatus(selectedInvoice.value.id, 'Paid', paymentAccount.value, paymentAmount.value);
        payDialog.value = false;
        paymentAccount.value = null;
        paymentAmount.value = 0;
    } catch (err) {
        uiStore.showError('Failed to update status');
    }
};

const downloadPDF = async (invoice) => {
    try {
        await invoiceStore.downloadPDF(invoice.id, invoice.invoice_number);
    } catch (err) {
        uiStore.showError('Could not download PDF');
    }
};

const shareWhatsApp = (invoice) => {
    const num = invoice.Customer?.phone_whatsapp;
    if (!num) return uiStore.showError('No phone number found');
    
    const msg = `Hi ${invoice.Customer?.name}, your invoice ${invoice.invoice_number} for AED ${invoice.total} is ready. Status: ${invoice.status}.`;
    openWhatsApp(num, msg);
};

const confirmCancel = async (invoice) => {
    if (confirm(`Are you sure you want to cancel invoice ${invoice.invoice_number}? This will permanently void the invoice and reverse any associated wallet income.`)) {
        try {
            await invoiceStore.updateStatus(invoice.id, 'Cancelled');
            loadInvoices({ page: currentPage.value, itemsPerPage: itemsPerPage.value });
        } catch (err) {
            uiStore.showError('Failed to cancel invoice');
        }
    }
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-GB');
};
</script>
