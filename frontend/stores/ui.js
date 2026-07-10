import { defineStore } from 'pinia';

export const useUIStore = defineStore('ui', {
  state: () => ({
    snackbar: {
      show: false,
      text: '',
      color: 'success',
      icon: 'mdi-check-circle'
    }
  }),
  actions: {
    showSuccess(text) {
      this.snackbar = {
        show: true,
        text,
        color: 'success',
        icon: 'mdi-check-circle'
      };
    },
    showError(text) {
      this.snackbar = {
        show: true,
        text: text || 'An unexpected error occurred.',
        color: 'error',
        icon: 'mdi-alert-circle'
      };
    },
    hideSnackbar() {
      this.snackbar.show = false;
    }
  }
});
