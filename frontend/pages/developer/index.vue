<template>
  <v-container fluid class="maintenance-page py-12 px-6">
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8" xl="6">
        
        <!-- Welcome Hero Section -->
        <div class="hero-section mb-12 animate-fade-in">
          <div class="d-flex align-center mb-4">
            <v-avatar color="primary" size="64" elevation="12" class="glass-avatar mr-6">
              <v-icon icon="mdi-shield-lock-outline" color="white" size="36"></v-icon>
            </v-avatar>
            <div>
              <h1 class="text-h3 font-weight-black color-primary mb-1 tracking-tight">System Integrity</h1>
              <p class="text-h6 text-grey-darken-1 font-weight-medium">DocClear Core Maintenance & Licensing Engine</p>
            </div>
          </div>
          <v-divider class="mb-4 opacity-10"></v-divider>
        </div>

        <v-row>
          <!-- Left Column: Configuration & Status -->
          <v-col cols="12" lg="7">
            <!-- Branding & Identity -->
            <v-card class="glass-card mb-6 animate-slide-up" style="--delay: 0.1s">
              <v-card-title class="pa-6 d-flex align-center">
                <v-avatar color="primary-container" size="40" class="mr-4">
                  <v-icon icon="mdi-identifier" color="primary"></v-icon>
                </v-avatar>
                <span class="text-h6 font-weight-bold">Brand Identity</span>
              </v-card-title>
              <v-divider class="opacity-10"></v-divider>
              <v-card-text class="pa-8">
                <v-row>
                  <v-col cols="12">
                    <v-text-field
                      v-model="branding.app_name"
                      label="Product Name"
                      placeholder="e.g. DocClear Pro"
                      prepend-inner-icon="mdi-pencil-box-outline"
                      class="custom-field"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12">
                    <v-text-field
                      v-model="branding.app_logo"
                      label="System Logo URL"
                      placeholder="https://..."
                      prepend-inner-icon="mdi-image-filter-center-focus"
                      class="custom-field"
                    >
                      <template v-slot:append-inner>
                        <v-btn
                          icon="mdi-cloud-upload-outline"
                          variant="text"
                          color="primary"
                          @click="$refs.logoInput.click()"
                          :loading="uploadingLogo"
                        ></v-btn>
                      </template>
                    </v-text-field>
                    <input
                      ref="logoInput"
                      type="file"
                      hidden
                      accept="image/*"
                      @change="handleLogoUpload"
                    />
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Security Configuration -->
            <v-card class="glass-card animate-slide-up" style="--delay: 0.2s">
              <v-card-title class="pa-6 d-flex align-center">
                <v-avatar color="error-container" size="40" class="mr-4">
                  <v-icon icon="mdi-security" color="error"></v-icon>
                </v-avatar>
                <span class="text-h6 font-weight-bold">Developer Security</span>
              </v-card-title>
              <v-divider class="opacity-10"></v-divider>
              <v-card-text class="pa-8">
                <v-row>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="security.new_password"
                      label="New Password"
                      type="password"
                      prepend-inner-icon="mdi-lock-outline"
                      class="custom-field"
                    ></v-text-field>
                  </v-col>
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="security.confirm_password"
                      label="Confirm Password"
                      type="password"
                      prepend-inner-icon="mdi-lock-check-outline"
                      class="custom-field"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>
          </v-col>

          <!-- Right Column: Licensing & Health -->
          <v-col cols="12" lg="5">
            <!-- License Engine -->
            <v-card class="glass-card h-100 d-flex flex-column animate-slide-up" style="--delay: 0.3s">
              <v-card-title class="pa-6 d-flex align-center">
                <v-avatar color="warning-container" size="40" class="mr-4">
                  <v-icon icon="mdi-key-star" color="warning"></v-icon>
                </v-avatar>
                <span class="text-h6 font-weight-bold">License Engine</span>
              </v-card-title>
              <v-divider class="opacity-10"></v-divider>
              
              <v-card-text class="pa-8 flex-grow-1">
                <div class="status-box pa-6 rounded-xl mb-8" :class="isExpired ? 'bg-error-light' : 'bg-success-light'">
                  <div class="text-overline font-weight-bold mb-2 opacity-70">Current Subscription Status</div>
                  <div class="d-flex align-center justify-space-between">
                    <div class="text-h4 font-weight-black" :class="isExpired ? 'text-error' : 'text-success'">
                      {{ isExpired ? 'EXPIRED' : 'ACTIVE' }}
                    </div>
                    <v-icon :icon="isExpired ? 'mdi-alert-decagram' : 'mdi-check-decagram'" size="48" class="opacity-30"></v-icon>
                  </div>
                  <div class="mt-4 text-body-2 font-weight-medium text-grey-darken-2">
                    Valid Until: <span class="font-weight-black text-black">{{ formatDate(branding.license_expiry_date) }}</span>
                  </div>
                </div>

                <div class="text-subtitle-2 font-weight-bold mb-4 ml-1">Update Grace Period</div>
                <v-btn-toggle
                  v-model="expiryOption"
                  color="primary"
                  variant="outlined"
                  mandatory
                  rounded="lg"
                  block
                  class="license-toggle mb-6"
                >
                  <v-btn value="1year" flex="1">1 Year</v-btn>
                  <v-btn value="custom" flex="1">Custom</v-btn>
                  <v-btn value="lifetime" flex="1">Lifetime</v-btn>
                </v-btn-toggle>

                <v-expand-transition>
                  <div v-if="expiryOption === 'custom'" class="mb-6">
                    <v-text-field
                      v-model="customExpiryDate"
                      label="Select Custom Date"
                      type="date"
                      class="custom-field"
                    ></v-text-field>
                  </div>
                </v-expand-transition>

                <v-alert
                  type="info"
                  variant="tonal"
                  class="rounded-xl mt-auto"
                  border="start"
                >
                  Changes here affect global system access immediately.
                </v-alert>
              </v-card-text>

              <v-divider class="opacity-10"></v-divider>
              <v-card-actions class="pa-6">
                <v-btn
                  block
                  color="primary"
                  size="x-large"
                  variant="flat"
                  @click="saveAllConfigs"
                  :loading="loading"
                  class="save-btn font-weight-black"
                >
                  COMMIT CHANGES
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-col>
    </v-row>

    <!-- Global Snackbar -->
    <v-snackbar v-model="snackbar.show" :color="snackbar.color" rounded="pill" location="top center">
      <div class="d-flex align-center">
        <v-icon :icon="snackbar.color === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle'" class="mr-3"></v-icon>
        <span class="font-weight-bold">{{ snackbar.text }}</span>
      </div>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useAuthStore } from '~/stores/auth';
import { useConfigStore } from '~/stores/config';
import dayjs from 'dayjs';

definePageMeta({
  middleware: ['auth-developer'],
  layout: 'developer'
});

const { $api } = useNuxtApp();
const auth = useAuthStore();
const configStore = useConfigStore();
const loading = ref(false);
const uploadingLogo = ref(false);
const logoInput = ref(null);

const branding = reactive({
  app_name: '',
  app_logo: '',
  license_expiry_date: ''
});

const security = reactive({
  new_password: '',
  confirm_password: ''
});

const expiryOption = ref('1year');
const customExpiryDate = ref('');

const snackbar = reactive({
  show: false,
  text: '',
  color: 'success'
});

const isExpired = computed(() => {
  if (!branding.license_expiry_date) return false;
  return dayjs().isAfter(dayjs(branding.license_expiry_date));
});

onMounted(async () => {
  await fetchConfigs();
});

const fetchConfigs = async () => {
  try {
    const res = await $api.get('/config');
    if (res.data.success) {
      Object.assign(branding, res.data.data);
    }
  } catch (err) {
    showNotify('Error fetching system configurations', 'error');
  }
};

const saveAllConfigs = async () => {
  if (security.new_password && security.new_password !== security.confirm_password) {
    return showNotify('Passwords do not match', 'error');
  }

  loading.value = true;
  try {
    const settings = {
      app_name: branding.app_name,
      app_logo: branding.app_logo
    };

    if (expiryOption.value === '1year') {
      settings.license_expiry_date = dayjs().add(1, 'year').toISOString();
    } else if (expiryOption.value === 'lifetime') {
      settings.license_expiry_date = dayjs('2099-12-31').toISOString();
    } else if (expiryOption.value === 'custom' && customExpiryDate.value) {
      settings.license_expiry_date = dayjs(customExpiryDate.value).toISOString();
    }

    await $api.put('/config', settings);

    if (security.new_password) {
      await $api.put(`/users/${auth.user.id}`, {
        password: security.new_password
      });
      security.new_password = '';
      security.confirm_password = '';
    }

    showNotify('System components updated successfully', 'success');
    await fetchConfigs();
    await configStore.fetchSettings();
  } catch (err) {
    showNotify('Operation failed. Check server logs.', 'error');
  } finally {
    loading.value = false;
  }
};

const handleLogoUpload = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('logo', file);

  uploadingLogo.value = true;
  try {
    const res = await $api.post('/config/upload-logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });

    if (res.data.success) {
      branding.app_logo = res.data.url;
      showNotify('Direct logo link generated', 'success');
    }
  } catch (err) {
    showNotify('Logo upload failed', 'error');
  } finally {
    uploadingLogo.value = false;
    if (logoInput.value) logoInput.value.value = '';
  }
};

const formatDate = (date) => date ? dayjs(date).format('DD MMMM YYYY') : 'Never';

const showNotify = (text, color = 'success') => {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
};
</script>

<style scoped>
.maintenance-page {
  background: transparent;
  min-height: calc(100vh - 72px);
}

.tracking-tight {
  letter-spacing: -2px;
}

.glass-card {
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3) !important;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07) !important;
  border-radius: 24px !important;
}

.glass-avatar {
  background: linear-gradient(135deg, #0B57D0 0%, #002d72 100%) !important;
  box-shadow: 0 10px 20px rgba(11, 87, 208, 0.3) !important;
}

.bg-success-light {
  background: rgba(20, 108, 46, 0.05);
  border: 1px dashed rgba(20, 108, 46, 0.2);
}

.bg-error-light {
  background: rgba(179, 38, 30, 0.05);
  border: 1px dashed rgba(179, 38, 30, 0.2);
}

.license-toggle {
  background: white !important;
  height: 52px !important;
  border-radius: 16px !important;
  overflow: hidden; /* Fix scrollbar */
}

.license-toggle :deep(.v-btn) {
  height: 52px !important;
  border-right: 1px solid rgba(var(--v-border-color), 0.1) !important;
}

.license-toggle :deep(.v-btn:last-child) {
  border-right: none !important;
}

.custom-field :deep(.v-field__outline) {
  --v-field-border-opacity: 0.1;
}

.save-btn {
  height: 64px !important;
  border-radius: 16px !important;
  font-size: 1.1rem !important;
  letter-spacing: 2px !important;
  transition: all 0.3s ease;
}

.save-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(11, 87, 208, 0.2) !important;
}

/* Animations */
.animate-fade-in {
  animation: fadeIn 0.8s ease-out;
}

.animate-slide-up {
  animation: slideUp 0.6s ease-out forwards;
  opacity: 0;
  animation-delay: var(--delay, 0s);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
