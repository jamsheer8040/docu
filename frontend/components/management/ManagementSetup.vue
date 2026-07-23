<template>
  <v-card class="border rounded-xl pa-4 max-w-sm" border>
    <div class="text-h6 font-weight-bold mb-4">Capital Setup</div>
    <v-form ref="form" v-model="valid" @submit.prevent="save">
      <v-text-field
        v-model="config.proposed_company_capital"
        label="Proposed Company Capital (AED)"
        variant="outlined"
        type="number"
        class="mb-4"
        :rules="[v => !!v || 'Required']"
      ></v-text-field>
      
      <v-btn type="submit" color="primary" block :loading="saving" :disabled="!valid">Save Configuration</v-btn>
    </v-form>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useConfigStore } from '~/stores/config';
import { useManagementStore } from '~/stores/management';

const configStore = useConfigStore();
const managementStore = useManagementStore();
const valid = ref(false);
const saving = ref(false);
const config = ref({
  proposed_company_capital: 0
});

const save = async () => {
  saving.value = true;
  try {
    const { $api } = useNuxtApp();
    await $api.put('/config', { proposed_company_capital: config.value.proposed_company_capital });
    await managementStore.fetchDashboardStats();
    await managementStore.fetchShareholders();
    alert('Capital Setup Saved');
  } catch (err) {
    alert('Failed to save config');
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  const { $api } = useNuxtApp();
  const res = await $api.get('/config');
  if (res.data.success) {
    config.value.proposed_company_capital = res.data.data.proposed_company_capital || 0;
  }
});
</script>
