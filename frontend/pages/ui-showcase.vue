<template>
  <v-container fluid class="pa-0">
    <!-- Floating Header Simulation -->
    <v-card class="floating-glass pa-4 mb-10 d-flex align-center" height="80">
      <v-avatar color="primary" variant="flat" size="48" class="mr-4 shadow-glow rounded-xl">
        <v-icon icon="mdi-vector-square" color="white"></v-icon>
      </v-avatar>
      <div class="d-none d-md-flex align-center" style="gap: 24px;">
        <v-btn variant="text" class="font-weight-black text-black">Home</v-btn>
        <v-btn variant="text" class="font-weight-black text-black">About</v-btn>
        <v-btn variant="text" class="font-weight-black text-black">Services</v-btn>
        <v-btn variant="text" class="font-weight-black text-black">Pricing</v-btn>
        <v-btn variant="text" class="font-weight-black text-black">Contact</v-btn>
      </div>
      <v-spacer></v-spacer>
      <v-btn icon="mdi-magnify" variant="tonal" class="mr-2" rounded="lg"></v-btn>
      <v-btn color="primary" variant="flat" class="px-8 shadow-glow">Login</v-btn>
    </v-card>

    <v-row>
      <!-- Main Content Area -->
      <v-col cols="12" lg="8">
        <v-row>
          <!-- Card Title & Content -->
          <v-col cols="12" md="6">
            <v-card class="pa-10 h-100 glass-card">
              <div class="d-flex justify-space-between align-center mb-6">
                <h2 class="text-h4 font-weight-black text-black mb-0">Card Title</h2>
                <v-btn icon="mdi-dots-horizontal" variant="text" size="small"></v-btn>
              </div>
              <p class="text-subtitle-1 text-secondary mb-10">
                This is an example of a card with some supporting text content.
              </p>
              <div class="d-flex" style="gap: 16px;">
                <v-btn color="primary" variant="flat" class="px-8 shadow-glow">Primary</v-btn>
                <v-btn variant="tonal" color="primary" class="px-8 bg-white opacity-90">Secondary</v-btn>
              </div>
            </v-card>
          </v-col>

          <!-- Create Account Form -->
          <v-col cols="12" md="6">
            <v-card class="pa-10 rounded-lg glass-card">
              <h2 class="text-h5 font-weight-bold mb-8 text-black">Create Account</h2>
              <v-text-field label="Name" placeholder="Enter name" class="mb-4"></v-text-field>
              <v-text-field label="Email" placeholder="Enter email" class="mb-4"></v-text-field>
              <v-text-field label="Password" type="password" placeholder="Enter password" class="mb-2" append-inner-icon="mdi-eye-outline"></v-text-field>
              <v-checkbox label="I agree to the Terms & Conditions" color="primary" density="compact" hide-details></v-checkbox>
              <v-btn color="primary" block variant="flat" size="x-large" class="mt-8 shadow-glow">Submit</v-btn>
            </v-card>
          </v-col>

          <!-- Controls Section -->
          <v-col cols="12">
            <v-card class="pa-10 rounded-lg glass-card">
              <v-row>
                <v-col cols="12" md="3">
                  <div class="text-overline mb-4 font-weight-black">Switch</div>
                  <v-switch color="primary" v-model="s1" inset hide-details></v-switch>
                </v-col>
                <v-col cols="12" md="3">
                  <div class="text-overline mb-4 font-weight-black">Checkbox</div>
                  <v-checkbox label="Check me" color="primary" hide-details v-model="c1"></v-checkbox>
                </v-col>
                <v-col cols="12" md="6" class="d-flex align-center" style="gap: 32px;">
                   <div class="text-center">
                    <v-progress-circular model-value="72" color="primary" size="80" width="8">
                      <div class="text-caption font-weight-black">72%</div>
                    </v-progress-circular>
                    <div class="text-caption mt-2 font-weight-bold opacity-60">Progress</div>
                   </div>
                   <div class="text-center">
                    <v-avatar color="primary" variant="tonal" size="80" class="rounded-xl">
                      <div class="text-h5 font-weight-black">128</div>
                    </v-avatar>
                    <div class="text-caption mt-2 font-weight-bold opacity-60">Total</div>
                   </div>
                </v-col>
              </v-row>

              <v-row class="mt-8">
                <v-col cols="12" md="4">
                   <div class="text-overline mb-4 font-weight-black">Buttons</div>
                   <div class="d-flex flex-column" style="gap: 12px;">
                     <v-btn color="primary" variant="flat" block>Elevated</v-btn>
                     <v-btn variant="outlined" color="primary" block>Outlined</v-btn>
                     <v-btn variant="text" color="primary" block>Text</v-btn>
                   </div>
                </v-col>
                <v-col cols="12" md="4">
                   <div class="text-overline mb-4 font-weight-black">Chips</div>
                   <div class="d-flex flex-wrap" style="gap: 8px;">
                     <v-chip closable color="primary">Chip Ã—</v-chip>
                     <v-chip closable color="primary">Filter Ã—</v-chip>
                     <v-btn icon="mdi-plus" size="x-small" variant="tonal" rounded="pill"></v-btn>
                   </div>
                </v-col>
                <v-col cols="12" md="4">
                   <div class="text-overline mb-4 font-weight-black">Selection</div>
                   <v-select label="Select an option" :items="['Option 1', 'Option 2']"></v-select>
                   <v-text-field label="Text Field" placeholder="Enter text..." append-inner-icon="mdi-keyboard-outline"></v-text-field>
                </v-col>
              </v-row>

              <v-row class="mt-8">
                 <v-col cols="12" md="6">
                    <div class="text-overline mb-4 font-weight-black">Slider</div>
                    <v-slider color="primary" v-model="vol" thumb-label></v-slider>
                 </v-col>
                 <v-col cols="12" md="6">
                    <div class="text-overline mb-4 font-weight-black">Range</div>
                    <v-range-slider color="primary" :model-value="[20, 60]"></v-range-slider>
                 </v-col>
              </v-row>
            </v-card>
          </v-col>
        </v-row>
      </v-col>

      <!-- Sidebar Components -->
      <v-col cols="12" lg="4">
        <v-card class="pa-10 mb-8 rounded-lg glass-card d-flex flex-column" style="gap: 16px;">
          <v-alert type="success" title="Success!" text="Your changes have been saved." closable></v-alert>
          <v-alert type="warning" title="Warning!" text="Please check your input." closable></v-alert>
          <v-alert type="error" title="Error!" text="Something went wrong." closable></v-alert>
        </v-card>

        <v-card class="pa-10 mb-8 rounded-lg glass-card">
           <div class="d-flex align-center justify-space-between mb-6">
              <v-btn icon="mdi-chevron-left" variant="text" size="small"></v-btn>
              <div class="font-weight-black">May 2024</div>
              <v-btn icon="mdi-chevron-right" variant="text" size="small"></v-btn>
           </div>
           <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px;" class="text-center">
              <div v-for="d in ['S','M','T','W','T','F','S']" :key="d" class="text-caption font-weight-black opacity-40">{{ d }}</div>
              <div v-for="i in 31" :key="i" class="py-2 rounded-lg cursor-pointer" :class="i === 15 ? 'bg-primary text-white font-weight-black shadow-glow rounded-circle' : ''">
                {{ i }}
              </div>
           </div>
        </v-card>
        
        <v-card class="pa-10 rounded-lg glass-card overflow-hidden">
          <v-table>
            <thead>
              <tr class="text-caption font-weight-black opacity-60">
                <th class="py-4">Name</th>
                <th>Role</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td class="font-weight-bold">John Doe</td>
                <td>Admin</td>
                <td><v-chip color="success" size="x-small" variant="flat">Active</v-chip></td>
              </tr>
              <tr>
                <td class="font-weight-bold">Jane Smith</td>
                <td>Editor</td>
                <td><v-chip color="success" size="x-small" variant="flat">Active</v-chip></td>
              </tr>
              <tr>
                <td class="font-weight-bold">Bob Wilson</td>
                <td>Viewer</td>
                <td><v-chip color="secondary" size="x-small" variant="flat">Inactive</v-chip></td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- Stepper Section (Matches Image) -->
    <v-card class="pa-12 mt-8 rounded-lg glass-card">
      <h2 class="text-h5 font-weight-bold mb-10">Process Overview</h2>
      <v-stepper :items="['Step 1', 'Step 2', 'Step 3']" alt-labels elevation="0" class="bg-transparent">
        <template v-slot:item.1>
          <div class="text-caption font-weight-bold text-center mt-2">Step 1 Completed</div>
        </template>
        <template v-slot:item.2>
          <div class="text-caption font-weight-bold text-center mt-2 text-primary">Step 2 In progress</div>
        </template>
        <template v-slot:item.3>
          <div class="text-caption font-weight-bold text-center mt-2 opacity-40">Step 3 Pending</div>
        </template>
      </v-stepper>
    </v-card>

    <div class="pa-12 mt-8 mb-12 text-center">
       <div class="d-flex align-center justify-center" style="gap: 16px;">
        <v-btn color="primary" variant="flat" @click="dialog = true" class="px-10 shadow-glow">Open Premium Modal</v-btn>
        <v-tooltip text="Premium UI Tooltip" location="top">
          <template v-slot:activator="{ props }">
            <v-btn icon="mdi-information-outline" v-bind="props" variant="tonal" color="primary"></v-btn>
          </template>
        </v-tooltip>
       </div>
    </div>

    <v-dialog v-model="dialog" max-width="500">
      <v-card class="pa-12 rounded-lg glass-card overflow-hidden">
        <div class="d-flex justify-space-between align-center mb-6">
          <h3 class="text-h4 font-weight-black">Modal Title</h3>
          <v-btn icon="mdi-close" variant="text" @click="dialog = false"></v-btn>
        </div>
        <p class="text-subtitle-1 text-secondary mb-10">
          This is a modal window with high-fidelity glass styling and intensified backdrop blur.
        </p>
        <div class="d-flex justify-end" style="gap: 16px;">
          <v-btn variant="tonal" class="px-8" @click="dialog = false">Cancel</v-btn>
          <v-btn color="primary" variant="flat" class="px-10 shadow-glow" @click="dialog = false">Save</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup>
const s1 = ref(true);
const c1 = ref(true);
const vol = ref(45);
const dialog = ref(false);
</script>

<style scoped>
.shadow-glow {
  box-shadow: 0 4px 20px rgba(59, 130, 246, 0.4) !important;
}
.rounded-circle {
  border-radius: 50% !important;
}
</style>
