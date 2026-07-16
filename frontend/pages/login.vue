<template>
  <v-container fluid fill-height class="login-container pa-0">
    <v-row align="center" justify="center" class="fill-height ma-0">
      <v-col cols="12" sm="10" md="8" lg="6" xl="4" class="d-flex justify-center">
        <v-card class="pa-8 pb-10 rounded-2xl glass-card text-center w-100" max-width="480" variant="flat">
          <div v-if="configStore.appLogo" class="mb-4 d-flex align-center justify-center mx-auto p-4 rounded-xl" style="width: 250px; height: 80px; background: rgba(255,255,255,0.4);">
             <v-img 
               :src="configStore.appLogo" 
               width="180"
               height="90"
               contain
             ></v-img>
          </div>
          <v-avatar v-else color="primary" size="80" variant="flat" rounded="lg" class="mb-6 shadow-glow">
            <v-icon size="40" color="white">mdi-shield-check</v-icon>
          </v-avatar>
          
          <h1 class="text-h4 font-weight-black text-gradient mb-1">Welcome Back</h1>
          <p class="text-subtitle-1 text-secondary mb-6 font-weight-medium">Please sign in to continue</p>

          <v-form @submit.prevent="handleLogin" class="text-left">
            <v-text-field
              v-model="state.email"
              label="Email Address"
              prepend-inner-icon="mdi-email-outline"
              type="email"
              autocomplete="email"
              :error-messages="v$.email.$errors.map(e => e.$message)"
              @blur="v$.email.$touch"
              class="mb-2"
            ></v-text-field>

            <v-text-field
              v-model="state.password"
              label="Password"
              prepend-inner-icon="mdi-lock-outline"
              type="password"
              autocomplete="current-password"
              :error-messages="v$.password.$errors.map(e => e.$message)"
              @blur="v$.password.$touch"
            ></v-text-field>

            <div class="d-flex align-center justify-space-between mt-1 mb-8">
              <v-checkbox label="Remember Me" hide-details density="compact" color="primary"></v-checkbox>
              <v-btn variant="text" size="small" color="primary" class="font-weight-bold ml-4">Forgot Password?</v-btn>
            </div>

            <v-btn
              type="submit"
              color="primary"
              block
              size="x-large"
              height="56"
              class="font-weight-bold"
              :loading="loading"
            >
              Sign In
            </v-btn>
          </v-form>

          <v-alert
            v-if="error"
            type="error"
            class="mt-6 text-left"
            closable
          >
            {{ error }}
          </v-alert>
          
          <div class="mt-8 text-caption text-secondary font-weight-medium">
            &copy; 2026 {{ configStore.appName }}. All rights reserved.
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { useVuelidate } from '@vuelidate/core';
import { required, email, minLength } from '@vuelidate/validators';
import { useAuthStore } from '~/stores/auth';
import { useConfigStore } from '~/stores/config';

definePageMeta({
  layout: false
});

const authStore = useAuthStore();
const configStore = useConfigStore();
const router = useRouter();

onMounted(async () => {
    await configStore.fetchSettings();
});

const state = reactive({
  email: '',
  password: ''
});

const rules = {
  email: { required, email },
  password: { required, minLength: minLength(6) }
};

const v$ = useVuelidate(rules, state);

const loading = ref(false);
const error = ref('');

const handleLogin = async () => {
  const isFormValid = await v$.value.$validate();
  if (!isFormValid) return;
  
  loading.value = true;
  error.value = '';
  
  try {
    const result = await authStore.login({
      email: state.email,
      password: state.password
    });
    
    if (result.success) {
      if (authStore.user?.role === 'Developer') {
        router.push('/saas-portal');
      } else {
        router.push('/');
      }
    } else {
      error.value = Array.isArray(result.message) ? result.message[0].msg : result.message;
    }
  } catch (err) {
    error.value = 'An unexpected error occurred.';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.login-container {
  height: 100vh;
  overflow: hidden;
  /* Background inherited from global body style */
}
.shadow-glow {
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.4) !important;
}
</style>
