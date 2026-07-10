<template>
  <v-chip
    :color="color"
    :size="size"
    :variant="variant"
    class="font-weight-bold text-uppercase px-3"
    label
  >
    <v-icon v-if="icon" start :icon="icon" size="x-small"></v-icon>
    {{ label || value }}
  </v-chip>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  value: { type: String, required: true },
  label: { type: String, default: '' },
  size: { type: String, default: 'x-small' },
  variant: { type: String, default: 'tonal' }
});

const config = computed(() => {
  const v = props.value.toLowerCase();
  
  // Document Statuses
  if (['expired', 'overdue', 'cancelled', 'unpaid', 'critical'].includes(v)) {
    return { color: 'error', icon: 'mdi-alert-circle' };
  }
  
  // Success/Paid
  if (['paid', 'completed', 'active', 'ok', 'safe'].includes(v)) {
    return { color: 'success', icon: 'mdi-check-circle' };
  }
  
  // In Progress/Medium urgency
  if (['inprogress', 'in progress', 'sent', 'warning'].includes(v)) {
    return { color: 'info', icon: 'mdi-clock-outline' };
  }

  // Pending/Neutral
  if (['pending', 'draft', 'inactive'].includes(v)) {
    return { color: 'grey-darken-1', icon: 'mdi-circle-medium' };
  }

  return { color: 'grey', icon: null };
});

const color = computed(() => config.value.color);
const icon = computed(() => config.value.icon);
</script>
