<template>
  <div class="pa-12 text-center d-flex flex-column align-center justify-center bg-surface-variant rounded-xl border-dashed">
    <v-avatar color="primary-lighten-5" size="80" class="mb-4">
      <v-icon :icon="icon" color="primary" size="x-large"></v-icon>
    </v-avatar>
    <div class="text-h6 font-weight-bold mb-2">{{ title }}</div>
    <div class="text-body-2 text-grey-darken-1 mb-6 max-width-300">
      {{ subtitle }}
    </div>
    <v-btn
      v-if="actionLabel"
      color="primary"
      variant="flat"
      @click="$emit('action')"
      class="rounded-pill px-6"
    >
      {{ actionLabel }}
    </v-btn>
  </div>
</template>

<script setup>
const props = defineProps({
  icon: { type: String, default: 'mdi-database-off-outline' },
  title: { type: String, default: 'No data found' },
  subtitle: { type: String, default: "We couldn't find any records matching your criteria." },
  actionLabel: { type: String, default: '' }
});

const emit = defineEmits(['action']);
</script>

<style scoped>
.max-width-300 {
  max-width: 300px;
}
.bg-surface-variant {
  background-color: #f8f9fa;
}
</style>
