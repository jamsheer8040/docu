<template>
  <v-dialog v-model="dialog" max-width="1200px" scrollable transition="dialog-bottom-transition">
    <v-card class="bg-background rounded-xl">
      <v-toolbar color="surface" flat border-b class="px-4">
        <v-btn icon="mdi-close" variant="text" @click="close"></v-btn>
        <v-toolbar-title class="font-weight-bold ml-2">
          <v-icon icon="mdi-cog-outline" class="mr-2" color="primary"></v-icon>
          Expense Settings
        </v-toolbar-title>
      </v-toolbar>

      <v-card-text class="pa-6">
        <v-row>
          <v-col cols="12" md="6">
            <v-card class="border rounded-xl h-100" variant="flat">
              <v-toolbar color="transparent" flat>
                <v-toolbar-title class="text-h6 font-weight-bold">Main Expense Types</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn color="primary" variant="tonal" prepend-icon="mdi-plus" size="small" @click="openMainTypeDialog()">Add Main Type</v-btn>
              </v-toolbar>
              <v-divider></v-divider>
              <v-data-table
                :headers="mainTypeHeaders"
                :items="mainTypes"
                :loading="loadingMain"
                hover
                density="comfortable"
              >
                <template v-slot:item.status="{ item }">
                  <v-chip size="x-small" :color="item.status === 'Active' ? 'success' : 'error'">{{ item.status }}</v-chip>
                </template>
                <template v-slot:item.actions="{ item }">
                  <v-btn icon="mdi-pencil-outline" size="small" variant="text" color="primary" @click="openMainTypeDialog(item)"></v-btn>
                  <v-btn icon="mdi-delete-outline" size="small" variant="text" color="error" @click="deleteMainType(item)"></v-btn>
                </template>
              </v-data-table>
            </v-card>
          </v-col>

          <v-col cols="12" md="6">
            <v-card class="border rounded-xl h-100" variant="flat">
              <v-toolbar color="transparent" flat>
                <v-toolbar-title class="text-h6 font-weight-bold">Expense Sub Types</v-toolbar-title>
                <v-spacer></v-spacer>
                <v-btn color="primary" variant="tonal" prepend-icon="mdi-plus" size="small" @click="openSubTypeDialog()">Add Sub Type</v-btn>
              </v-toolbar>
              <v-divider></v-divider>
              <v-data-table
                :headers="subTypeHeaders"
                :items="subTypes"
                :loading="loadingSub"
                hover
                density="comfortable"
              >
                <template v-slot:item.ParentType.type_name="{ item }">
                  <span class="font-weight-bold text-primary">{{ item.ParentType?.type_name }}</span>
                </template>
                <template v-slot:item.status="{ item }">
                  <v-chip size="x-small" :color="item.status === 'Active' ? 'success' : 'error'">{{ item.status }}</v-chip>
                </template>
                <template v-slot:item.actions="{ item }">
                  <v-btn icon="mdi-pencil-outline" size="small" variant="text" color="primary" @click="openSubTypeDialog(item)"></v-btn>
                  <v-btn icon="mdi-delete-outline" size="small" variant="text" color="error" @click="deleteSubType(item)"></v-btn>
                </template>
              </v-data-table>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Main Type Dialog -->
    <v-dialog v-model="mainTypeDialog" max-width="500px">
      <v-card class="rounded-xl border">
        <v-card-title class="pa-4 font-weight-bold border-b">
          {{ isEditMain ? 'Edit Main Expense Type' : 'New Main Expense Type' }}
        </v-card-title>
        <v-card-text class="pa-4">
          <v-form ref="mainForm" v-slot="{ isValid }">
            <v-text-field
              v-model="mainFormState.type_name"
              label="Type Name *"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || 'Name is required']"
              class="mb-2"
            ></v-text-field>
            <v-text-field
              v-model="mainFormState.description"
              label="Description"
              variant="outlined"
              density="comfortable"
              class="mb-2"
            ></v-text-field>
            <v-switch
              v-model="mainFormState.status"
              true-value="Active"
              false-value="Inactive"
              label="Active Status"
              color="success"
              hide-details
            ></v-switch>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4 border-t">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="mainTypeDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" :loading="savingMain" @click="saveMainType">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Sub Type Dialog -->
    <v-dialog v-model="subTypeDialog" max-width="600px">
      <v-card class="rounded-xl border">
        <v-card-title class="pa-4 font-weight-bold border-b">
          {{ isEditSub ? 'Edit Expense Sub Type' : 'New Expense Sub Type' }}
        </v-card-title>
        <v-card-text class="pa-4">
          <v-form ref="subForm" v-slot="{ isValid }">
            <div class="d-flex align-center mb-4">
              <v-select
                v-model="subFormState.expense_type_id"
                :items="mainTypes"
                item-title="type_name"
                item-value="id"
                label="Parent Expense Type *"
                variant="outlined"
                density="comfortable"
                hide-details
                :rules="[v => !!v || 'Parent Type is required']"
                class="flex-grow-1 mr-2"
              ></v-select>
              <v-btn color="primary" variant="tonal" height="48" @click="openInlineMainTypeDialog">
                <v-icon icon="mdi-plus"></v-icon> Add New Type
              </v-btn>
            </div>
            
            <v-text-field
              v-model="subFormState.sub_type_name"
              label="Expense Sub Type Name *"
              variant="outlined"
              density="comfortable"
              :rules="[v => !!v || 'Name is required']"
              class="mb-2"
            ></v-text-field>
            <v-text-field
              v-model="subFormState.description"
              label="Description"
              variant="outlined"
              density="comfortable"
              class="mb-2"
            ></v-text-field>
            <v-switch
              v-model="subFormState.status"
              true-value="Active"
              false-value="Inactive"
              label="Active Status"
              color="success"
              hide-details
            ></v-switch>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-4 border-t">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="subTypeDialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" :loading="savingSub" @click="saveSubType">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-dialog>
</template>

<script setup>
import { useUIStore } from '~/stores/ui'

const uiStore = useUIStore()
import { ref, reactive, watch, onMounted } from 'vue';
import { useNuxtApp } from '#imports';

const props = defineProps({
  modelValue: Boolean
});
const emit = defineEmits(['update:modelValue', 'saved']);
const dialog = ref(props.modelValue);
const { $api } = useNuxtApp();

watch(() => props.modelValue, (val) => {
  dialog.value = val;
  if (val) {
    fetchData();
  }
});
watch(dialog, (val) => {
  emit('update:modelValue', val);
});

const close = () => {
  emit('saved');
  dialog.value = false;
};

// Data
const mainTypes = ref([]);
const subTypes = ref([]);
const loadingMain = ref(false);
const loadingSub = ref(false);

const mainTypeHeaders = [
  { title: 'Main Type', key: 'type_name' },
  { title: 'Total Sub Types', key: 'sub_type_count', align: 'center' },
  { title: 'Status', key: 'status', align: 'center' },
  { title: 'Action', key: 'actions', align: 'end', sortable: false }
];

const subTypeHeaders = [
  { title: 'Sub Type', key: 'sub_type_name' },
  { title: 'Parent Type', key: 'ParentType.type_name' },
  { title: 'Status', key: 'status', align: 'center' },
  { title: 'Action', key: 'actions', align: 'end', sortable: false }
];

const fetchData = async () => {
  fetchMainTypes();
  fetchSubTypes();
};

const fetchMainTypes = async () => {
  loadingMain.value = true;
  try {
    const res = await $api.get('/expense-types');
    if (res.data.success) mainTypes.value = res.data.data;
  } catch (err) {
    console.error(err);
  } finally {
    loadingMain.value = false;
  }
};

const fetchSubTypes = async () => {
  loadingSub.value = true;
  try {
    const res = await $api.get('/expense-sub-types');
    if (res.data.success) subTypes.value = res.data.data;
  } catch (err) {
    console.error(err);
  } finally {
    loadingSub.value = false;
  }
};

// Main Type Logic
const mainTypeDialog = ref(false);
const isEditMain = ref(false);
const savingMain = ref(false);
const mainForm = ref(null);
const mainFormState = reactive({ id: null, type_name: '', description: '', status: 'Active' });

const openMainTypeDialog = (item = null) => {
  if (item) {
    isEditMain.value = true;
    Object.assign(mainFormState, item);
  } else {
    isEditMain.value = false;
    Object.assign(mainFormState, { id: null, type_name: '', description: '', status: 'Active' });
  }
  mainTypeDialog.value = true;
};

const saveMainType = async () => {
  const { valid } = await mainForm.value.validate();
  if (!valid) return;
  savingMain.value = true;
  try {
    const payload = {
      type_name: mainFormState.type_name,
      description: mainFormState.description,
      status: mainFormState.status
    };
    let res;
    if (isEditMain.value) {
      res = await $api.put(`/expense-types/${mainFormState.id}`, payload);
    } else {
      res = await $api.post('/expense-types', payload);
    }
    if (res.data.success) {
      await fetchMainTypes();
      
      // Auto-select if we created inline from the sub-type form
      if (subTypeDialog.value && !isEditMain.value) {
        subFormState.expense_type_id = res.data.data.id;
      }
      
      mainTypeDialog.value = false;
    }
  } catch (err) {
    uiStore.showError(err.response?.data?.message || 'Failed to save Main Type');
  } finally {
    savingMain.value = false;
  }
};

const deleteMainType = async (item) => {
  if (confirm(`Delete Main Type "${item.type_name}"?`)) {
    try {
      await $api.delete(`/expense-types/${item.id}`);
      fetchMainTypes();
    } catch (err) {
      uiStore.showError(err.response?.data?.message || 'Failed to delete');
    }
  }
};

// Sub Type Logic
const subTypeDialog = ref(false);
const isEditSub = ref(false);
const savingSub = ref(false);
const subForm = ref(null);
const subFormState = reactive({ id: null, expense_type_id: null, sub_type_name: '', description: '', status: 'Active' });

const openSubTypeDialog = (item = null) => {
  if (item) {
    isEditSub.value = true;
    Object.assign(subFormState, item);
  } else {
    isEditSub.value = false;
    Object.assign(subFormState, { id: null, expense_type_id: null, sub_type_name: '', description: '', status: 'Active' });
  }
  subTypeDialog.value = true;
};

const openInlineMainTypeDialog = () => {
  openMainTypeDialog();
};

const saveSubType = async () => {
  const { valid } = await subForm.value.validate();
  if (!valid) return;
  savingSub.value = true;
  try {
    const payload = {
      expense_type_id: subFormState.expense_type_id,
      sub_type_name: subFormState.sub_type_name,
      description: subFormState.description,
      status: subFormState.status
    };
    if (isEditSub.value) {
      await $api.put(`/expense-sub-types/${subFormState.id}`, payload);
    } else {
      await $api.post('/expense-sub-types', payload);
    }
    await fetchSubTypes();
    await fetchMainTypes(); // Refresh counts
    subTypeDialog.value = false;
  } catch (err) {
    uiStore.showError(err.response?.data?.message || 'Failed to save Sub Type');
  } finally {
    savingSub.value = false;
  }
};

const deleteSubType = async (item) => {
  if (confirm(`Delete Sub Type "${item.sub_type_name}"?`)) {
    try {
      await $api.delete(`/expense-sub-types/${item.id}`);
      fetchSubTypes();
      fetchMainTypes();
    } catch (err) {
      uiStore.showError(err.response?.data?.message || 'Failed to delete');
    }
  }
};
</script>
