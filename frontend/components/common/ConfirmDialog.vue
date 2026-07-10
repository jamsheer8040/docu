<template>
  <v-dialog v-model="show" max-width="400px" persistent>
    <v-card class="pa-0 rounded-xl overflow-hidden">
      <div :class="`bg-${color} pa-6 text-center text-white`" v-if="icon || title">
        <v-icon :icon="icon" size="48" class="mb-2 opacity-90"></v-icon>
        <div class="text-h5 font-weight-bold">{{ title }}</div>
      </div>
      
      <div class="pa-8 text-center pt-8">
        <v-card-text class="pa-0 text-body-1 font-weight-medium text-grey-darken-2 line-height-relaxed">
          {{ message }}
        </v-card-text>
        
        <v-card-actions class="mt-8 pa-0 d-flex flex-column gap-3">
          <v-btn 
            :color="color" 
            variant="flat" 
            class="px-8 font-weight-bold elevation-2" 
            height="52"
            rounded="lg"
            block
            @click="confirm" 
            :loading="loading"
          >
            {{ confirmText }}
          </v-btn>
          <v-btn 
            variant="text" 
            color="grey-darken-1" 
            class="px-8 font-weight-bold" 
            height="44"
            rounded="lg"
            block
            @click="cancel"
          >
            {{ cancelText }}
          </v-btn>
        </v-card-actions>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, default: 'Confirm Action' },
  message: { type: String, default: 'Are you sure you want to proceed?' },
  confirmText: { type: String, default: 'Confirm' },
  cancelText: { type: String, default: 'Cancel' },
  color: { type: String, default: 'primary' },
  icon: { type: String, default: 'mdi-help-circle-outline' },
  loading: { type: Boolean, default: false }
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

const show = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const confirm = () => emit('confirm');
const cancel = () => {
    show.value = false;
    emit('cancel');
};
</script>
