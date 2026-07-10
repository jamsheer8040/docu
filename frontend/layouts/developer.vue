<template>
  <v-app>
    <!-- Top App Bar - Minimalist for Developer -->
    <v-app-bar elevation="0" class="px-4 glass-card" height="80">
      <div class="d-flex align-center cursor-default">
        <div v-if="configStore.appLogo" class="mr-4 d-flex align-center justify-center p-2 rounded-xl" style="width: 160px; height: 80px; background: rgba(255,255,255,0.4);">
           <v-img 
             :src="configStore.appLogo" 
             width="140"
             height="70"
             contain
           ></v-img>
        </div>
        <v-avatar v-else color="primary" variant="flat" rounded="lg" size="40" class="mr-3">
          <v-icon icon="mdi-xml" color="white" size="20"></v-icon>
        </v-avatar>
      </div>

      <v-spacer></v-spacer>

      <v-chip color="primary" class="mr-4 font-weight-bold" variant="flat">
        <v-icon start icon="mdi-shield-check" size="18"></v-icon>
        DEVELOPER MODE
      </v-chip>

      <!-- Logout Only -->
      <v-btn
        prepend-icon="mdi-logout"
        variant="flat"
        color="error"
        class="px-6 font-weight-bold"
        @click="logout"
      >
        Sign Out
      </v-btn>
    </v-app-bar>

    <!-- Main Content - No Sidebar -->
    <v-main>
      <v-container fluid class="pa-8 fill-height align-start">
        <slot />
      </v-container>
    </v-main>

    <!-- Global Notification (Snackbar) -->
    <v-snackbar
      v-model="uiStore.snackbar.show"
      :color="uiStore.snackbar.color"
      :timeout="4000"
      location="top right"
      variant="flat"
      elevation="24"
    >
      <div class="d-flex align-center">
        <v-icon :icon="uiStore.snackbar.icon" class="mr-3"></v-icon>
        <span class="font-weight-medium">{{ uiStore.snackbar.text }}</span>
      </div>
      <template v-slot:actions>
        <v-btn icon="mdi-close" variant="text" @click="uiStore.hideSnackbar"></v-btn>
      </template>
    </v-snackbar>
  </v-app>
</template>

<script setup>
import { useAuthStore } from '~/stores/auth';
import { useUIStore } from '~/stores/ui';
import { useConfigStore } from '~/stores/config';

const authStore = useAuthStore();
const configStore = useConfigStore();
const uiStore = useUIStore();

onMounted(async () => {
  await configStore.fetchSettings();
});

const logout = () => {
  authStore.logout();
  navigateTo('/login');
};
</script>

<style scoped>
/* Scoped styles removed in favor of global glass system */
</style>
