<template>
  <v-container fluid class="fill-height bg-grey-lighten-4 pa-0">
    <v-row no-gutters class="fill-height align-center justify-center">
      <v-col cols="12" sm="8" md="6" lg="4" class="text-center pa-6">
        <v-avatar color="error" size="120" class="mb-8 elevation-12">
          <v-icon icon="mdi-lock-clock" size="64" color="white"></v-icon>
        </v-avatar>
        
        <h1 class="text-h3 font-weight-black mb-4 color-primary">System Expired</h1>
        <p class="text-h6 text-grey-darken-1 mb-8">
          The license for this application has reached its expiry date. 
          Please contact your system developer or administrator to renew.
        </p>

        <v-divider class="mb-8 opacity-20"></v-divider>

        <div class="d-flex flex-column align-center">
          <v-btn
            color="primary"
            variant="flat"
            size="large"
            rounded="lg"
            block
            class="mb-4 font-weight-bold"
            height="56"
            @click="navigateTo('/login')"
          >
            Go to Login
          </v-btn>
          
          <v-btn
            variant="text"
            color="grey-darken-1"
            class="text-none"
            to="/developer"
          >
            Developer Login
          </v-btn>
        </div>
        
        <div class="mt-12 text-caption text-grey opacity-50">
          Ref ID: LIC-EXP-{{ Date.now().toString(36).toUpperCase() }}
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
definePageMeta({
  layout: false
});
</script>
