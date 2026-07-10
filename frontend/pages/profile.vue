<template>
  <v-container fluid class="pa-6 bg-workspace min-vh-100">
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-h4 font-weight-black color-primary mb-1">My Account</h1>
          <p class="text-subtitle-1 text-grey-darken-1">Manage your personal information and security settings</p>
        </div>

        <v-row>
          <!-- Left Col: Profile Info -->
          <v-col cols="12" md="4">
            <v-card class="rounded-2xl border pa-6 text-center h-100" variant="flat">
              <v-avatar color="primary" variant="tonal" size="120" class="mb-4">
                <v-icon icon="mdi-account" size="64"></v-icon>
              </v-avatar>
              <div class="text-h5 font-weight-bold mb-1">{{ authStore.user?.name }}</div>
              <v-chip color="secondary" label size="small" class="text-uppercase font-weight-bold mb-4">
                {{ authStore.user?.role }}
              </v-chip>
              <v-divider class="my-4"></v-divider>
              <div class="text-left">
                <div class="d-flex align-center mb-3">
                  <v-icon icon="mdi-email-outline" size="18" class="mr-3 opacity-60"></v-icon>
                  <span class="text-body-2">{{ authStore.user?.email }}</span>
                </div>
                <div class="d-flex align-center">
                  <v-icon icon="mdi-calendar-clock" size="18" class="mr-3 opacity-60"></v-icon>
                  <span class="text-body-2">Member since {{ formatDate(authStore.user?.createdAt) }}</span>
                </div>
              </div>
            </v-card>
          </v-col>

          <!-- Right Col: Tabs & Forms -->
          <v-col cols="12" md="8">
            <v-card class="rounded-2xl border overflow-hidden" variant="flat">
              <v-tabs v-model="activeTab" color="primary" border-b>
                <v-tab value="profile" prepend-icon="mdi-account-details-outline">Profile Details</v-tab>
                <v-tab value="security" prepend-icon="mdi-shield-lock-outline" id="security">Security</v-tab>
              </v-tabs>

              <v-window v-model="activeTab" class="pa-6">
                <!-- Profile Tab -->
                <v-window-item value="profile">
                  <h3 class="text-h6 font-weight-bold mb-6">Personal Information</h3>
                  <v-form disabled>
                    <v-row>
                      <v-col cols="12" md="6">
                        <v-text-field
                          label="Full Name"
                          v-model="authStore.user.name"
                          variant="outlined"
                          rounded="lg"
                          readonly
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" md="6">
                        <v-text-field
                          label="Email Address"
                          v-model="authStore.user.email"
                          variant="outlined"
                          rounded="lg"
                          readonly
                        ></v-text-field>
                      </v-col>
                    </v-row>
                  </v-form>
                  <v-alert
                    type="info"
                    variant="tonal"
                    border="start"
                    class="mt-4 rounded-xl"
                    icon="mdi-information-outline"
                  >
                    Profile information can only be updated by a System Administrator.
                  </v-alert>
                </v-window-item>

                <!-- Security Tab -->
                <v-window-item value="security">
                  <h3 class="text-h6 font-weight-bold mb-2">Change Password</h3>
                  <p class="text-caption text-grey mb-6">Ensure your account is using a long, random password to stay secure.</p>
                  
                  <v-form ref="passwordForm" v-model="valid" @submit.prevent="updatePassword">
                    <v-text-field
                      label="Current Password"
                      v-model="passwordData.current"
                      type="password"
                      variant="outlined"
                      rounded="lg"
                      class="mb-2"
                      :rules="[v => !!v || 'Required']"
                    ></v-text-field>
                    <v-text-field
                      label="New Password"
                      v-model="passwordData.new"
                      type="password"
                      variant="outlined"
                      rounded="lg"
                      class="mb-2"
                      :rules="[v => !!v || 'Required', v => v.length >= 6 || 'Min 6 characters']"
                    ></v-text-field>
                    <v-text-field
                      label="Confirm New Password"
                      v-model="passwordData.confirm"
                      type="password"
                      variant="outlined"
                      rounded="lg"
                      class="mb-6"
                      :rules="[v => v === passwordData.new || 'Passwords do not match']"
                    ></v-text-field>
                    
                    <v-btn
                      type="submit"
                      color="primary"
                      variant="flat"
                      rounded="lg"
                      height="48"
                      class="px-8 font-weight-bold"
                      :loading="loading"
                    >
                      Update Password
                    </v-btn>
                  </v-form>
                </v-window-item>
              </v-window>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Global Snackbar is in layout -->
  </v-container>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useUIStore } from '~/stores/ui';
import dayjs from 'dayjs';

const authStore = useAuthStore();
const uiStore = useUIStore();
const route = useRoute();

const activeTab = ref('profile');
const loading = ref(false);
const valid = ref(false);
const passwordForm = ref(null);

const passwordData = reactive({
  current: '',
  new: '',
  confirm: ''
});

onMounted(() => {
  if (route.hash === '#security') {
    activeTab.value = 'security';
  }
});

const formatDate = (date) => date ? dayjs(date).format('MMMM D, YYYY') : 'N/A';

const updatePassword = async () => {
  const { valid: formVal } = await passwordForm.value.validate();
  if (!formVal) return;

  loading.value = true;
  try {
    const { $api } = useNuxtApp();
    await $api.put('/auth/change-password', {
      currentPassword: passwordData.current,
      newPassword: passwordData.new
    });
    
    uiStore.showSuccess('Password updated successfully!');
    passwordData.current = '';
    passwordData.new = '';
    passwordData.confirm = '';
    passwordForm.value.resetValidation();
  } catch (err) {
    uiStore.showError(err.response?.data?.message || 'Failed to update password');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.bg-workspace {
  background-color: #F8F9FA;
}
.min-vh-100 {
  min-height: 100vh;
}
</style>
