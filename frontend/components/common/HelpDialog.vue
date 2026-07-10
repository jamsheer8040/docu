<template>
  <v-card class="rounded-xl pa-4" border variant="flat">
    <v-card-title class="d-flex align-center pa-4">
      <v-avatar color="primary" variant="tonal" class="mr-3" size="40">
        <v-icon icon="mdi-help-circle-outline" color="primary"></v-icon>
      </v-avatar>
      <div class="text-h6 font-weight-bold">DocClear Quick Guide</div>
      <v-spacer></v-spacer>
      <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('close')"></v-btn>
    </v-card-title>
    
    <v-card-text class="pa-4 pt-0">
      <v-divider class="mb-4"></v-divider>
      
      <div v-for="(section, i) in helpSections" :key="i" class="mb-6">
        <h3 class="text-subtitle-1 font-weight-bold color-primary mb-2">
          <v-icon :icon="section.icon" size="small" class="mr-2"></v-icon>
          {{ section.title }}
        </h3>
        <p class="text-body-2 text-grey-darken-2 mb-3">
          {{ section.description }}
        </p>
        <v-list density="compact" class="bg-grey-lighten-5 rounded-lg border">
          <v-list-item v-for="(tip, j) in section.tips" :key="j" density="compact">
            <template v-slot:prepend>
              <v-icon icon="mdi-circle-small" size="x-small" color="primary"></v-icon>
            </template>
            <v-list-item-title class="text-caption font-weight-medium text-grey-darken-3">
              {{ tip }}
            </v-list-item-title>
          </v-list-item>
        </v-list>
      </div>
      
      <v-alert
        color="primary"
        variant="tonal"
        icon="mdi-information-outline"
        class="rounded-xl border border-primary text-body-2"
        density="comfortable"
      >
        Need more help? Contact our internal support team at **support@docclear.com** or internal extension #401.
      </v-alert>
    </v-card-text>
    
    <v-card-actions class="pa-4">
      <v-btn block color="primary" variant="flat" height="48" class="rounded-lg" @click="$emit('close')">
        Got it, thanks!
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
defineEmits(['close']);

const helpSections = [
  {
    title: 'Customer Management',
    icon: 'mdi-account-group-outline',
    description: 'Central hub for all client records and financial histories.',
    tips: [
      'Use "Add Customer" to create new profiles with WhatsApp details.',
      'Check customer profiles for linked documents and unpaid invoices.',
      'Inactive customers are hidden by default; use the filter to manage them.'
    ]
  },
  {
    title: 'Document Tracking',
    icon: 'mdi-file-clock-outline',
    description: 'Never miss an expiry with our automated Kanban tracking.',
    tips: [
      'Expired: Immediate action required.',
      'Critical: Expiring within 5 days.',
      'Warning: Expiring within 15 days.',
      'Click documents to update their status or upload new versions.'
    ]
  },
  {
    title: 'Invoices & Workflow',
    icon: 'mdi-robot-outline',
    description: 'Automate billing through service workflows.',
    tips: [
      'New service orders start as "Pending".',
      'Completing an order automatically generates a "Draft" invoice.',
      'Record payments in the Invoice section to sync with your Wallet balance.'
    ]
  }
];
</script>
