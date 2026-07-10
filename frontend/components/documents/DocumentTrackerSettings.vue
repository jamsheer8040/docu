<template>
  <v-card class="rounded-xl glass-card">
    <v-toolbar color="primary" class="text-white" title="Document Tracker Settings">
      <template v-slot:append>
        <v-btn icon="mdi-close" @click="$emit('close')"></v-btn>
      </template>
    </v-toolbar>
    <v-card-text class="pa-4">
      <div class="d-flex justify-space-between align-center mb-4">
        <h3 class="text-h6 font-weight-bold">Tracker Stages</h3>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openAdd">Add Stage</v-btn>
      </div>

      <v-data-table
        :headers="headers"
        :items="stages"
        hide-default-footer
        class="bg-transparent"
      >
        <template v-slot:item.color="{ item }">
          <v-chip :color="item.color" size="small" class="text-uppercase font-weight-bold">{{ item.color }}</v-chip>
        </template>
        <template v-slot:item.icon="{ item }">
          <v-icon :icon="item.icon" :color="item.color"></v-icon>
        </template>
        <template v-slot:item.formula="{ item }">
          <span v-if="item.minDays !== null && item.maxDays !== null" class="font-weight-medium">
            {{ item.minDays }} to {{ item.maxDays }} days
          </span>
          <span v-else-if="item.minDays !== null" class="font-weight-medium">
            > {{ item.minDays }} days
          </span>
          <span v-else-if="item.maxDays !== null" class="font-weight-medium">
            <= {{ item.maxDays }} days
          </span>
          <span v-else class="font-weight-medium">All</span>
        </template>
        <template v-slot:item.actions="{ item, index }">
          <v-btn icon="mdi-pencil" variant="text" size="small" color="primary" @click="openEdit(item, index)"></v-btn>
          <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="removeStage(index)"></v-btn>
        </template>
      </v-data-table>

      <div class="d-flex justify-end mt-4">
        <v-btn color="grey-darken-1" variant="text" @click="$emit('close')" class="mr-2">Cancel</v-btn>
        <v-btn color="primary" :loading="saving" @click="saveSettings">Save Settings</v-btn>
      </div>
    </v-card-text>

    <!-- Add/Edit Dialog -->
    <v-dialog v-model="editDialog" max-width="500px" persistent>
      <v-card class="rounded-xl glass-card">
        <v-card-title class="font-weight-bold pa-4">{{ editIndex === -1 ? 'Add Stage' : 'Edit Stage' }}</v-card-title>
        <v-card-text class="pa-4 pt-0">
          <v-text-field v-model="editItem.title" label="Title" variant="outlined" density="compact" class="mb-4"></v-text-field>
          <v-row class="mb-2">
            <v-col cols="6">
              <v-text-field v-model.number="editItem.minDays" type="number" label="Min Days (Empty = no limit)" variant="outlined" density="compact" hide-details></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field v-model.number="editItem.maxDays" type="number" label="Max Days (Empty = no limit)" variant="outlined" density="compact" hide-details></v-text-field>
            </v-col>
          </v-row>
          <v-select
            v-model="editItem.color"
            :items="['primary', 'secondary', 'success', 'info', 'warning', 'error', 'error-lighten-1', 'grey']"
            label="Color"
            variant="outlined"
            density="compact"
            class="mb-4"
          ></v-select>
          <v-text-field v-model="editItem.icon" label="Icon (e.g., mdi-alert)" variant="outlined" density="compact" hide-details></v-text-field>
        </v-card-text>
        <v-card-actions class="pa-4 pt-0">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="editDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" @click="saveEdit">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useNuxtApp } from '#app';
import { useUIStore } from '@/stores/ui';

const { $api } = useNuxtApp();
const uiStore = useUIStore();
const emit = defineEmits(['close', 'saved']);

const props = defineProps({
  initialStages: {
    type: Array,
    default: () => []
  }
});

const stages = ref([]);
const saving = ref(false);

const editDialog = ref(false);
const editIndex = ref(-1);
const editItem = ref({ title: '', minDays: null, maxDays: null, color: 'primary', icon: 'mdi-file-document' });

const headers = [
  { title: 'Title', key: 'title' },
  { title: 'Formula (Days)', key: 'formula' },
  { title: 'Color', key: 'color' },
  { title: 'Icon', key: 'icon' },
  { title: 'Actions', key: 'actions', align: 'end' }
];

onMounted(() => {
  if (props.initialStages && props.initialStages.length > 0) {
    stages.value = JSON.parse(JSON.stringify(props.initialStages));
  } else {
    stages.value = [
      { id: 'expired', title: 'Expired', minDays: null, maxDays: -1, color: 'error', icon: 'mdi-alert-circle' },
      { id: 'critical', title: 'Critical (0-7 Days)', minDays: 0, maxDays: 7, color: 'error-lighten-1', icon: 'mdi-clock-alert-outline' },
      { id: 'warning', title: 'Warning (8-14 Days)', minDays: 8, maxDays: 14, color: 'warning', icon: 'mdi-bell-alert-outline' },
      { id: 'due_soon', title: 'Due Soon (15-30 Days)', minDays: 15, maxDays: 30, color: 'info', icon: 'mdi-calendar-clock' },
      { id: 'active', title: 'Active (>30 Days)', minDays: 31, maxDays: null, color: 'success', icon: 'mdi-check-circle-outline' }
    ];
  }
});

const openAdd = () => {
  editIndex.value = -1;
  editItem.value = { title: '', minDays: null, maxDays: null, color: 'primary', icon: 'mdi-file-document' };
  editDialog.value = true;
};

const openEdit = (item, index) => {
  editIndex.value = index;
  editItem.value = { ...item };
  editDialog.value = true;
};

const saveEdit = () => {
  if (!editItem.value.title) return uiStore.showError('Title is required');
  
  if (!editItem.value.id) {
    editItem.value.id = editItem.value.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
  }

  if (editItem.value.minDays === '') editItem.value.minDays = null;
  if (editItem.value.maxDays === '') editItem.value.maxDays = null;

  if (editIndex.value > -1) {
    stages.value[editIndex.value] = { ...editItem.value };
  } else {
    stages.value.push({ ...editItem.value });
  }
  editDialog.value = false;
};

const removeStage = (index) => {
  if (confirm('Are you sure you want to remove this stage?')) {
    stages.value.splice(index, 1);
  }
};

const saveSettings = async () => {
  saving.value = true;
  try {
    const res = await $api.put('/config', { document_stages: stages.value });
    if (res.data.success) {
      uiStore.showSuccess('Settings saved successfully');
      emit('saved', stages.value);
    } else {
      uiStore.showError(res.data.message || 'Failed to save settings');
    }
  } catch (err) {
    uiStore.showError('Error saving settings');
  } finally {
    saving.value = false;
  }
};
</script>
