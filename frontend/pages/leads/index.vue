<template>
  <v-container fluid class="leads-page py-8 px-6">
    <div class="d-flex justify-space-between align-center mb-8">
      <div>
        <h1 class="text-h3 font-weight-black text-gradient mb-1">Lead Management</h1>
        <p class="text-subtitle-1 text-secondary font-weight-medium">Track and convert potential customers</p>
      </div>
      <div class="d-flex gap-4">
        <v-btn-toggle v-model="viewMode" mandatory rounded="xl" class="border-light" density="comfortable" color="primary">
          <v-btn value="list" prepend-icon="mdi-format-list-bulleted">List</v-btn>
          <v-btn value="kanban" prepend-icon="mdi-view-column">Kanban</v-btn>
        </v-btn-toggle>
        <v-btn
          color="primary"
          size="large"
          prepend-icon="mdi-plus-circle"
          rounded="xl"
          elevation="2"
          class="font-weight-bold"
          @click="openCreateDialog"
        >
          Add Lead
        </v-btn>
      </div>
    </div>

    <!-- Search & Filters -->
    <v-card class="glass-card mb-6 pa-4 rounded-2xl border-light" variant="flat">
      <v-row align="center">
        <v-col cols="12" sm="4">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Search Leads"
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
            bg-color="surface"
          ></v-text-field>
        </v-col>
        <v-col cols="12" sm="4" v-if="viewMode === 'list'">
          <v-select
            v-model="statusFilter"
            :items="['All', 'New', 'Contacted', 'Qualified', 'Won', 'Lost']"
            label="Filter by Status"
            variant="outlined"
            density="compact"
            hide-details
            rounded="lg"
            bg-color="surface"
          ></v-select>
        </v-col>
      </v-row>
    </v-card>

    <!-- ═══════════════════════════════════════ -->
    <!-- LIST VIEW                              -->
    <!-- ═══════════════════════════════════════ -->
    <v-card v-if="viewMode === 'list'" class="glass-card rounded-2xl border-light overflow-hidden" variant="flat">
      <v-data-table
        :headers="headers"
        :items="filteredLeads"
        :search="search"
        :loading="leadStore.loading"
        class="bg-transparent cursor-pointer"
        hover
      >
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center py-2">
            <v-avatar color="primary" size="36" class="mr-3 text-white font-weight-bold">
              {{ (item.company_name || item.name || '?').charAt(0).toUpperCase() }}
            </v-avatar>
            <div>
              <div class="font-weight-bold text-body-1">{{ item.company_name }}</div>
              <div class="text-caption text-secondary" v-if="item.name">{{ item.name }}</div>
            </div>
          </div>
        </template>

        <!-- Contact column -->
        <template v-slot:item.contact="{ item }">
          <div class="d-flex flex-column">
            <a
              v-if="item.phone"
              :href="`https://wa.me/${item.phone.replace(/[^0-9]/g, '')}`"
              target="_blank"
              class="d-flex align-center text-body-2 mb-1 text-decoration-none whatsapp-link"
              @click.stop="leadStore.trackWhatsappClick(item.id)"
            >
              <v-icon size="small" class="mr-1" color="success">mdi-whatsapp</v-icon>
              <span class="text-success">{{ item.phone }}</span>
              <v-tooltip location="top" :text="`WhatsApp opened ${item.whatsapp_clicks || 0} time(s)`">
                <template v-slot:activator="{ props }">
                  <v-chip
                    v-bind="props"
                    size="x-small"
                    :color="(item.whatsapp_clicks || 0) > 0 ? 'success' : 'default'"
                    variant="tonal"
                    class="ml-2 font-weight-bold"
                    style="font-size: 10px;"
                  >{{ item.whatsapp_clicks || 0 }}</v-chip>
                </template>
              </v-tooltip>
            </a>
            <div v-if="item.email" class="d-flex align-center text-body-2 text-secondary">
              <v-icon size="small" class="mr-1">mdi-email</v-icon> {{ item.email }}
            </div>
          </div>
        </template>

        <!-- Service column -->
        <template v-slot:item.service="{ item }">
          <v-chip v-if="item.Service" size="small" variant="tonal" color="primary" class="font-weight-medium">
            <v-icon size="x-small" class="mr-1">mdi-briefcase</v-icon>
            {{ item.Service.name }}
          </v-chip>
          <span v-else class="text-caption text-secondary">None</span>
        </template>

        <!-- Status column - clickable dropdown -->
        <template v-slot:item.status="{ item }">
          <v-menu location="bottom">
            <template v-slot:activator="{ props }">
              <v-chip
                v-bind="props"
                :color="getStatusColor(item.status)"
                size="small"
                variant="flat"
                class="font-weight-bold px-3 text-uppercase cursor-pointer"
                style="letter-spacing: 0.5px"
                append-icon="mdi-chevron-down"
              >
                {{ item.status }}
              </v-chip>
            </template>
            <v-list density="compact">
              <v-list-item
                v-for="status in kanbanColumns"
                :key="status"
                @click="updateLeadStatus(item, status)"
                :disabled="status === item.status"
              >
                <v-list-item-title class="d-flex align-center">
                  <v-chip :color="getStatusColor(status)" size="x-small" class="mr-2" style="width: 12px; height: 12px;"></v-chip>
                  {{ status }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </template>

        <!-- Date column -->
        <template v-slot:item.created_at="{ item }">
          <span class="text-caption text-secondary">{{ formatDate(item.created_at) }}</span>
        </template>

        <!-- Actions column -->
        <template v-slot:item.actions="{ item }">
          <div class="d-flex align-center justify-end gap-2">
            <!-- Won lead: conversion buttons -->
            <template v-if="item.status === 'Won'">
              <v-btn
                v-if="item.customer_id && !item.converted_at"
                variant="text"
                color="success"
                size="small"
                class="font-weight-bold"
                prepend-icon="mdi-check"
                :to="`/customers/${item.customer_id}`"
              >
                Existing Customer
              </v-btn>
              <v-btn
                v-else-if="item.converted_at"
                variant="text"
                color="success"
                size="small"
                class="font-weight-bold"
                prepend-icon="mdi-check-decagram"
                :to="`/customers/${item.customer_id}`"
              >
                Converted
              </v-btn>
              <v-btn
                v-else
                variant="tonal"
                color="primary"
                size="small"
                class="font-weight-bold"
                :loading="convertingId === item.id"
                @click.stop="executeConvert(item)"
                v-show="authStore.can('customers', 'write')"
              >
                Convert to Customer
              </v-btn>
            </template>

            <v-btn
              icon="mdi-pencil"
              variant="text"
              color="primary"
              size="small"
              @click.stop="openEditDialog(item)"
            ></v-btn>
            <v-btn
              v-if="authStore.can('customers', 'delete')"
              icon="mdi-delete"
              variant="text"
              color="error"
              size="small"
              @click.stop="confirmDelete(item)"
            ></v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- ═══════════════════════════════════════ -->
    <!-- KANBAN VIEW                            -->
    <!-- ═══════════════════════════════════════ -->
    <div v-if="viewMode === 'kanban'" class="kanban-board mb-6">
      <div class="d-flex overflow-x-auto pb-4 gap-4" style="min-height: 520px;">
        <div
          v-for="column in kanbanColumns"
          :key="column"
          class="kanban-column"
          @dragover.prevent
          @dragenter.prevent
          @drop="onDrop($event, column)"
        >
          <!-- Column Header -->
          <div class="d-flex align-center mb-4 px-1">
            <div class="status-dot mr-2" :class="`bg-${getStatusColor(column)}`"></div>
            <h3 class="text-subtitle-1 font-weight-bold mb-0">{{ column }}</h3>
            <v-chip size="x-small" variant="tonal" class="ml-auto font-weight-bold">{{ getLeadsByStatus(column).length }}</v-chip>
          </div>

          <!-- Lead Cards -->
          <div class="kanban-cards d-flex flex-column gap-3">
            <v-card
              v-for="lead in getLeadsByStatus(column)"
              :key="lead.id"
              class="kanban-card cursor-pointer border-light"
              elevation="1"
              rounded="lg"
              draggable="true"
              @dragstart="onDragStart($event, lead)"
              @click="openEditDialog(lead)"
            >
              <v-card-text class="pa-3">
                <div class="d-flex justify-space-between align-start mb-2">
                  <div class="font-weight-bold text-body-2 text-truncate flex-grow-1 mr-1">{{ lead.company_name }}</div>
                  <v-btn
                    v-if="authStore.can('customers', 'delete')"
                    icon="mdi-delete"
                    variant="text"
                    color="error"
                    size="x-small"
                    @click.stop="confirmDelete(lead)"
                  ></v-btn>
                </div>

                <div class="text-caption text-secondary mb-2" v-if="lead.name">
                  <v-icon size="x-small" class="mr-1">mdi-account</v-icon>{{ lead.name }}
                </div>

                <div v-if="lead.Service" class="d-flex align-center text-caption text-primary font-weight-medium mb-1">
                  <v-icon size="x-small" class="mr-1">mdi-briefcase</v-icon>{{ lead.Service.name }}
                </div>

                <div v-if="lead.source" class="d-flex align-center text-caption text-secondary mb-1">
                  <v-icon size="x-small" class="mr-1">mdi-tag-outline</v-icon>{{ lead.source }}
                </div>

                <a
                  v-if="lead.phone"
                  :href="`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`"
                  target="_blank"
                  class="d-flex align-center text-caption mb-1 text-decoration-none whatsapp-link"
                  @click.stop="leadStore.trackWhatsappClick(lead.id)"
                >
                  <v-icon size="x-small" class="mr-1" color="success">mdi-whatsapp</v-icon>
                  <span class="text-success">{{ lead.phone }}</span>
                  <v-tooltip location="top" :text="`WhatsApp opened ${lead.whatsapp_clicks || 0} time(s)`">
                    <template v-slot:activator="{ props }">
                      <v-chip
                        v-bind="props"
                        size="x-small"
                        :color="(lead.whatsapp_clicks || 0) > 0 ? 'success' : 'default'"
                        variant="tonal"
                        class="ml-1 font-weight-bold"
                        style="font-size: 9px;"
                      >{{ lead.whatsapp_clicks || 0 }}</v-chip>
                    </template>
                  </v-tooltip>
                </a>
                <div v-if="lead.email" class="d-flex align-center text-caption text-secondary mb-2">
                  <v-icon size="x-small" class="mr-1">mdi-email</v-icon>
                  <span class="text-truncate">{{ lead.email }}</span>
                </div>

                <div class="d-flex justify-space-between align-center mt-2 pt-2 border-t">
                  <span class="text-caption text-grey-darken-1">{{ formatDate(lead.created_at) }}</span>

                  <!-- Won card: convert button -->
                  <div v-if="lead.status === 'Won'">
                    <v-btn
                      v-if="lead.customer_id && !lead.converted_at"
                      variant="text"
                      color="success"
                      size="x-small"
                      class="font-weight-bold px-1"
                      prepend-icon="mdi-check"
                      :to="`/customers/${lead.customer_id}`"
                    >
                      Existing
                    </v-btn>
                    <v-btn
                      v-else-if="lead.converted_at"
                      variant="text"
                      color="success"
                      size="x-small"
                      class="font-weight-bold px-1"
                      prepend-icon="mdi-check-decagram"
                      :to="`/customers/${lead.customer_id}`"
                    >
                      Converted
                    </v-btn>
                    <v-btn
                      v-else
                      variant="tonal"
                      color="primary"
                      size="x-small"
                      class="font-weight-bold"
                      :loading="convertingId === lead.id"
                      @click.stop="executeConvert(lead)"
                      v-show="authStore.can('customers', 'write')"
                    >
                      Convert
                    </v-btn>
                  </div>
                </div>
              </v-card-text>
            </v-card>

            <!-- Empty state -->
            <div v-if="getLeadsByStatus(column).length === 0" class="kanban-empty-slot text-center py-10 text-secondary">
              <v-icon size="32" class="mb-2 opacity-30">mdi-inbox-outline</v-icon>
              <div class="text-caption">No leads here</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Lead Create/Edit Dialog -->
    <LeadDialog
      v-if="dialogVisible"
      v-model="dialogVisible"
      :lead="selectedLead"
      @saved="onSaved"
    />

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card class="rounded-xl text-center pa-6">
        <v-icon size="64" color="error" class="mb-4">mdi-alert-circle</v-icon>
        <h3 class="text-h5 font-weight-bold mb-2">Delete Lead</h3>
        <p class="text-body-1 text-grey-darken-1 mb-6">
          Are you sure you want to delete this lead? This action cannot be undone.
        </p>
        <div class="d-flex justify-center gap-4">
          <v-btn variant="tonal" rounded="lg" size="large" @click="deleteDialog = false">Cancel</v-btn>
          <v-btn color="error" rounded="lg" size="large" class="px-8" :loading="deleting" @click="executeDelete">Delete</v-btn>
        </div>
      </v-card>
    </v-dialog>

  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useLeadStore } from '~/stores/leads';
import { useUIStore } from '~/stores/ui';
import { useAuthStore } from '~/stores/auth';
import LeadDialog from '~/components/leads/LeadDialog.vue';
import dayjs from 'dayjs';

const leadStore = useLeadStore();
const uiStore = useUIStore();
const authStore = useAuthStore();

const search = ref('');
const statusFilter = ref('All');
const viewMode = ref('list');
const kanbanColumns = ['New', 'Contacted', 'Qualified', 'Won', 'Lost'];

const dialogVisible = ref(false);
const selectedLead = ref(null);

const deleteDialog = ref(false);
const leadToDelete = ref(null);
const deleting = ref(false);

const convertingId = ref(null);

const headers = [
  { title: 'Lead Details', key: 'name', sortable: true },
  { title: 'Contact', key: 'contact', sortable: false },
  { title: 'Service', key: 'service', sortable: true },
  { title: 'Source', key: 'source', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Added On', key: 'created_at', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false, align: 'end' }
];

const filteredLeads = computed(() => {
  let list = leadStore.leads;
  if (statusFilter.value !== 'All') {
    list = list.filter(l => l.status === statusFilter.value);
  }
  if (search.value) {
    const q = search.value.toLowerCase();
    list = list.filter(l =>
      (l.name || '').toLowerCase().includes(q) ||
      (l.company_name || '').toLowerCase().includes(q) ||
      (l.email || '').toLowerCase().includes(q) ||
      (l.phone || '').toLowerCase().includes(q)
    );
  }
  return list;
});

const getStatusColor = (status) => {
  const map = {
    'New': 'info',
    'Contacted': 'warning',
    'Qualified': 'primary',
    'Lost': 'error',
    'Won': 'success'
  };
  return map[status] || 'grey';
};

const formatDate = (date) => {
  return dayjs(date).format('DD MMM YYYY');
};

const getLeadsByStatus = (status) => {
  return filteredLeads.value
    .filter(l => l.status === status)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
};

const onDragStart = (event, lead) => {
  event.dataTransfer.setData('leadId', lead.id);
  event.dataTransfer.effectAllowed = 'move';
};

const onDrop = (event, targetStatus) => {
  const leadId = event.dataTransfer.getData('leadId');
  if (!leadId) return;
  const lead = leadStore.leads.find(l => l.id == leadId);
  if (!lead || lead.status === targetStatus) return;
  updateLeadStatus(lead, targetStatus);
};

const updateLeadStatus = async (lead, newStatus, source = 'List') => {
  try {
    await leadStore.updateLead(lead.id, { status: newStatus, update_source: source });
    uiStore.showSuccess(`Status updated to ${newStatus}`);
  } catch (error) {
    uiStore.showError('Failed to update status');
  }
};

const openCreateDialog = () => {
  selectedLead.value = null;
  dialogVisible.value = true;
};

const openEditDialog = (item) => {
  selectedLead.value = Object.assign({}, item);
  dialogVisible.value = true;
};

const confirmDelete = (item) => {
  leadToDelete.value = item;
  deleteDialog.value = true;
};

const executeDelete = async () => {
  deleting.value = true;
  try {
    await leadStore.deleteLead(leadToDelete.value.id);
    uiStore.showSuccess('Lead deleted');
    deleteDialog.value = false;
  } catch (error) {
    uiStore.showError('Failed to delete lead');
  } finally {
    deleting.value = false;
  }
};

const executeConvert = async (lead) => {
  convertingId.value = lead.id;
  try {
    await leadStore.convertLead(lead.id);
    uiStore.showSuccess('Lead successfully converted to Customer!');
    await leadStore.fetchLeads();
  } catch (error) {
    uiStore.showError(error.message || 'Failed to convert lead');
  } finally {
    convertingId.value = null;
  }
};

const onSaved = () => {
  uiStore.showSuccess('Lead saved successfully');
};

onMounted(() => {
  leadStore.fetchLeads();
});
</script>

<style scoped>
.text-gradient {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, #90caf9 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.kanban-board {
  width: 100%;
}

.kanban-column {
  min-width: 300px;
  max-width: 300px;
  background: rgba(var(--v-theme-surface-variant), 0.4);
  border: 1px solid rgba(var(--v-border-color), 0.15);
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.kanban-cards {
  min-height: 80px;
  flex: 1;
}

.kanban-empty-slot {
  border: 2px dashed rgba(var(--v-border-color), 0.3);
  border-radius: 12px;
}

.kanban-card {
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.kanban-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12) !important;
}

.whatsapp-link {
  transition: opacity 0.15s ease;
}
.whatsapp-link:hover {
  opacity: 0.75;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
