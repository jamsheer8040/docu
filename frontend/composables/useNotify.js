import { useUIStore } from '~/stores/ui';

export const useNotify = () => {
    const uiStore = useUIStore();

    return {
        success: (msg) => uiStore.showSuccess(msg),
        error: (msg) => uiStore.showError(msg),
        info: (msg) => uiStore.showSuccess(msg), // Fallback or map to info color
        hide: () => uiStore.hideSnackbar()
    };
};
