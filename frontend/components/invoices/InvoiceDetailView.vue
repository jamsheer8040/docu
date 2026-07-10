<template>
  <v-card class="pa-0 rounded-xl overflow-hidden shadow-2xl">
    <!-- Header with Actions -->
    <v-toolbar color="surface" elevation="0" class="border-b px-4" height="72">
      <div class="ml-4">
        <div class="text-h6 font-weight-bold">Invoice {{ currentInvoice?.invoice_number }}</div>
        <div class="text-caption opacity-60">Status: <InvoiceStatusChip :status="currentInvoice?.status || 'Draft'" /></div>
      </div>
      <v-spacer></v-spacer>
      <div class="d-flex gap-2">
        <v-btn
          color="success"
          variant="tonal"
          prepend-icon="mdi-whatsapp"
          @click="shareWhatsApp"
        >
          Share
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          prepend-icon="mdi-file-pdf-box"
          @click="downloadPDF"
          class="px-6"
        >
          Download PDF
        </v-btn>
        <v-btn icon="mdi-close" variant="text" @click="$emit('close')" class="ml-2"></v-btn>
      </div>
    </v-toolbar>

    <v-card-text class="pa-10 bg-grey-lighten-4" style="max-height: 75vh; overflow-y: auto;">
      <!-- Invoice Canvas (Mimics A4) -->
      <v-card class="mx-auto pa-10 shadow-lg invoice-canvas" max-width="800" elevation="1">
        <!-- Branding -->
        <v-row class="mb-10 align-top">
          <v-col cols="6">
            <div class="text-h4 font-weight-bold color-primary mb-2">DocClear</div>
            <div class="text-caption opacity-70">
              Building A-1, Business Bay<br />
              Dubai, UAE<br />
              Phone: +971 4 000 0000
            </div>
          </v-col>
          <v-col cols="6" class="text-right">
            <h1 class="text-h2 font-weight-black opacity-10 mb-4">INVOICE</h1>
            <div class="text-subtitle-1 font-weight-bold">{{ currentInvoice?.invoice_number }}</div>
            <div class="text-caption">Date: {{ formatDate(currentInvoice?.createdAt) }}</div>
            <div class="text-caption" v-if="currentInvoice?.due_date">Due: {{ formatDate(currentInvoice?.due_date) }}</div>
          </v-col>
        </v-row>

        <v-divider class="mb-8 opacity-20"></v-divider>

        <!-- Billing Details -->
        <v-row class="mb-10">
          <v-col cols="6">
            <div class="text-caption text-uppercase font-weight-bold opacity-60 mb-2">Bill To:</div>
            <div class="text-subtitle-1 font-weight-bold">{{ currentInvoice?.Customer?.name }}</div>
            <div class="text-body-2 opacity-70">
              {{ currentInvoice?.Customer?.phone_whatsapp }}<br />
              Dubai, United Arab Emirates
            </div>
          </v-col>
        </v-row>

        <!-- Items Table -->
        <v-table class="mb-10 custom-invoice-table">
          <thead>
            <tr class="bg-primary text-white">
              <th class="text-left font-weight-bold color-on-primary">DESCRIPTION</th>
              <th class="text-center font-weight-bold color-on-primary">QTY</th>
              <th class="text-right font-weight-bold color-on-primary">PRICE</th>
              <th class="text-right font-weight-bold color-on-primary">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in currentInvoice?.InvoiceItems" :key="item.id">
              <td>{{ item.description }}</td>
              <td class="text-center">{{ item.quantity }}</td>
              <td class="text-right">{{ parseFloat(item.unit_price).toFixed(2) }}</td>
              <td class="text-right font-weight-bold">{{ parseFloat(item.total).toFixed(2) }}</td>
            </tr>
          </tbody>
        </v-table>

        <!-- Totals Logic -->
        <v-row justify="end">
          <v-col cols="5">
            <div class="d-flex justify-space-between mb-2">
              <span class="opacity-60">Subtotal</span>
              <span class="font-weight-medium">AED {{ parseFloat(currentInvoice?.subtotal || 0).toFixed(2) }}</span>
            </div>
            <div v-if="parseFloat(currentInvoice?.discount || 0) > 0" class="d-flex justify-space-between mb-2 text-error">
              <span>Discount</span>
              <span>-AED {{ parseFloat(currentInvoice?.discount || 0).toFixed(2) }}</span>
            </div>
            <div v-if="parseFloat(currentInvoice?.tax || 0) > 0" class="d-flex justify-space-between mb-4">
              <span>Tax / VAT (5%)</span>
              <span>AED {{ parseFloat(currentInvoice?.tax || 0).toFixed(2) }}</span>
            </div>
            <v-divider class="mb-4"></v-divider>
            <div class="d-flex justify-space-between align-center mb-2">
              <span class="text-subtitle-1 font-weight-bold">Total (AED)</span>
              <span class="text-h4 font-weight-bold color-primary">{{ parseFloat(currentInvoice?.total || 0).toFixed(2) }}</span>
            </div>
            
            <v-divider class="my-4"></v-divider>
            
            <div v-if="parseFloat(currentInvoice?.paid_amount || 0) > 0" class="d-flex justify-space-between mb-2 text-success">
              <span class="font-weight-bold">Paid Amount</span>
              <span class="font-weight-bold">AED {{ parseFloat(currentInvoice?.paid_amount || 0).toFixed(2) }}</span>
            </div>
            
            <div class="d-flex justify-space-between align-center">
              <span class="text-subtitle-1 font-weight-bold">Balance Due</span>
              <span class="text-h5 font-weight-bold color-primary">AED {{ (parseFloat(currentInvoice?.total || 0) - parseFloat(currentInvoice?.paid_amount || 0)).toFixed(2) }}</span>
            </div>
          </v-col>
        </v-row>

        <!-- Footer Notes -->
        <div class="mt-15 pt-10 border-t text-center">
          <p class="text-caption opacity-40 mb-2">Payment Terms: 15 Days from Invoice Date</p>
          <p class="text-caption opacity-60">Thank you for Choosing DocClear Management System!</p>
        </div>
      </v-card>
    </v-card-text>
    
    <!-- Status Action Bar (if not paid) -->
    <v-card-actions v-if="currentInvoice?.status !== 'Paid'" class="pa-6 border-t justify-center">
       <v-btn 
            color="success" 
            variant="flat" 
            size="large" 
            prepend-icon="mdi-credit-card-check"
            class="px-10"
            @click="markAsPaid"
       >
        Register Payment
       </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { computed, onMounted } from 'vue';
import { useInvoiceStore } from '~/stores/invoices';
import InvoiceStatusChip from '~/components/invoices/InvoiceStatusChip.vue';
import { useWhatsApp } from '~/composables/useWhatsApp';

const props = defineProps({
  invoiceId: { type: Number, required: true }
});

const emit = defineEmits(['close']);
const invoiceStore = useInvoiceStore();
const { openWhatsApp } = useWhatsApp();

const currentInvoice = computed(() => invoiceStore.currentInvoice);

onMounted(async () => {
  await invoiceStore.fetchInvoiceById(props.invoiceId);
});

const downloadPDF = async () => {
    await invoiceStore.downloadPDF(currentInvoice.value.id, currentInvoice.value.invoice_number);
};

const shareWhatsApp = () => {
    const num = currentInvoice.value.Customer?.phone_whatsapp;
    const msg = `Hi ${currentInvoice.value.Customer?.name}, please see your invoice ${currentInvoice.value.invoice_number} for AED ${currentInvoice.value.total}.`;
    openWhatsApp(num, msg);
};

const markAsPaid = () => {
    // This usually opens the Pay Dialog in the parent, but I'll 
    // emit a specific event or just alert the user to use the list action.
    alert('Please use the "Mark as Paid" option in the main list to select a destination account.');
};

const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB');
};
</script>

<style scoped>
.invoice-canvas {
    background-color: #fff;
    min-height: 1000px;
    border-radius: 4px;
}
.custom-invoice-table thead th {
    height: 48px !important;
}
.shadow-2xl {
    box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5) !important;
}
</style>
