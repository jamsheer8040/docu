<template>
  <v-dialog v-model="dialog" max-width="800px" scrollable>
    <v-card class="rounded-xl border">
      <v-toolbar color="surface" flat border-b>
        <v-toolbar-title class="font-weight-bold">
          <v-icon icon="mdi-cog-outline" class="mr-2" color="primary"></v-icon>
          Expense Settings
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" @click="close"></v-btn>
      </v-toolbar>

      <v-card-text class="pa-6" style="background-color: #fcfcfc;">
        <div class="d-flex align-center justify-space-between mb-4">
          <div>
            <h3 class="text-h6 font-weight-bold">Expense Types & Items</h3>
            <div class="text-caption text-grey">Define hierarchical categories for your expenses.</div>
          </div>
          <v-btn color="primary" variant="tonal" prepend-icon="mdi-plus" @click="addType">Add Type</v-btn>
        </div>

        <v-expand-transition group>
          <v-card 
            v-for="(type, index) in settings" 
            :key="type.id" 
            class="mb-4 border rounded-lg overflow-hidden bg-white" 
            variant="flat"
          >
            <div class="d-flex align-center pa-4 bg-grey-lighten-4 border-b">
              <v-text-field
                v-model="type.name"
                label="Type Name (e.g. Vehicle, Office)"
                variant="outlined"
                density="compact"
                hide-details
                class="flex-grow-1 mr-4 bg-white"
              ></v-text-field>
              <v-btn icon="mdi-delete-outline" color="error" variant="text" size="small" @click="removeType(index)"></v-btn>
            </div>
            
            <div class="pa-4">
              <div class="d-flex align-center justify-space-between mb-2">
                <div class="text-subtitle-2 font-weight-bold text-grey-darken-1">Expense Items under this Type:</div>
                <v-btn size="x-small" color="primary" variant="text" prepend-icon="mdi-plus" @click="addItem(index)">Add Item</v-btn>
              </div>

              <div v-if="!type.items || type.items.length === 0" class="text-caption text-grey italic pa-2">
                No items added yet.
              </div>

              <v-row dense>
                <v-col cols="12" md="6" lg="4" v-for="(item, itemIndex) in type.items" :key="itemIndex">
                  <div class="d-flex align-center">
                    <v-text-field
                      v-model="type.items[itemIndex]"
                      placeholder="e.g. Fuel, Salik"
                      variant="underlined"
                      density="compact"
                      hide-details
                    ></v-text-field>
                    <v-btn icon="mdi-close" color="error" variant="text" size="x-small" class="ml-1" @click="removeItem(index, itemIndex)"></v-btn>
                  </div>
                </v-col>
              </v-row>
            </div>
          </v-card>
        </v-expand-transition>
      </v-card-text>

      <v-card-actions class="pa-4 border-t bg-surface">
        <v-spacer></v-spacer>
        <v-btn variant="text" @click="close">Cancel</v-btn>
        <v-btn color="primary" variant="flat" class="px-6" @click="save" :loading="saving">Save Settings</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useNuxtApp } from '#imports';

const props = defineProps({
  modelValue: Boolean
});

const emit = defineEmits(['update:modelValue', 'saved']);

const dialog = ref(props.modelValue);
const { $api } = useNuxtApp();

const settings = ref([]);
const saving = ref(false);

const loadSettings = async () => {
  try {
    const res = await $api.get('/config');
    if (res.data.success && res.data.data.expense_categories) {
      settings.value = res.data.data.expense_categories;
    } else {
      settings.value = [];
    }
  } catch (err) {
    console.error('Failed to load settings', err);
  }
};

watch(() => props.modelValue, (val) => {
  dialog.value = val;
  if (val) {
    loadSettings();
  }
});

watch(dialog, (val) => {
  emit('update:modelValue', val);
});

const addType = () => {
  settings.value.push({
    id: Date.now().toString(),
    name: '',
    items: []
  });
};

const removeType = (index) => {
  settings.value.splice(index, 1);
};

const addItem = (typeIndex) => {
  if (!settings.value[typeIndex].items) {
    settings.value[typeIndex].items = [];
  }
  settings.value[typeIndex].items.push('');
};

const removeItem = (typeIndex, itemIndex) => {
  settings.value[typeIndex].items.splice(itemIndex, 1);
};

const close = () => {
  dialog.value = false;
};

const save = async () => {
  saving.value = true;
  try {
    // Clean up empty types/items
    const cleanedSettings = settings.value
      .filter(t => t.name.trim() !== '')
      .map(t => ({
        ...t,
        items: (t.items || []).filter(i => i.trim() !== '')
      }));

    const res = await $api.put('/config', {
      expense_categories: cleanedSettings
    });

    if (res.data.success) {
      emit('saved', cleanedSettings);
      close();
    }
  } catch (err) {
    alert('Failed to save settings');
  } finally {
    saving.value = false;
  }
};
</script>
