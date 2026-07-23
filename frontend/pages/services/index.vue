<template>
  <v-container fluid class="pa-2 pa-sm-4 pa-md-6">
    <!-- Page Header -->
    <v-row class="mb-6 align-center">
      <v-col cols="12" md="6">
        <h1 class="text-h4 font-weight-bold">
          <v-icon icon="mdi-cog-outline" class="mr-2" color="primary"></v-icon>
          Service Management
        </h1>
        <p class="text-subtitle-1 text-grey-darken-1">Manage service workflows from start to invoice</p>
      </v-col>
      <v-col cols="12" md="6" class="d-flex align-center justify-md-end flex-wrap gap-3">
        <v-btn
          v-if="auth.can('settings', 'write')"
          color="secondary"
          variant="outlined"
          prepend-icon="mdi-cog-outline"
          rounded="lg"
          height="44"
          class="px-4 font-weight-bold mr-2"
          @click="settingsDialog = true"
        >
          Settings
        </v-btn>
        <v-btn
          v-if="auth.can('services', 'write')"
          color="primary"
          variant="flat"
          prepend-icon="mdi-clipboard-plus-outline"
          rounded="lg"
          elevation="2"
          height="44"
          class="px-6 font-weight-bold"
          @click="openOrderForm()"
        >
          New Service Order
        </v-btn>
      </v-col>
    </v-row>

    <!-- VIEW TOGGLE & FILTERS -->
    <v-card class="mb-6 border pa-2" border variant="flat">
      <div class="d-flex align-center flex-wrap gap-4 px-4">
        <v-tabs v-model="viewMode" color="primary" density="compact" class="rounded-lg">
          <v-tab value="kanban" prepend-icon="mdi-view-column-outline">Kanban Board</v-tab>
          <v-tab value="list" prepend-icon="mdi-format-list-bulleted">List View</v-tab>
        </v-tabs>
        <v-spacer></v-spacer>
        <!-- Criticality Filter -->
        <v-select
          v-model="criticalityFilter"
          :items="[
            { title: 'Show All', value: 'All' },
            { title: 'Critical Only 🔴', value: 'Critical' },
            { title: 'Moderate Only 🟠', value: 'Moderate' },
            { title: 'Normal Only 🟢', value: 'Normal' }
          ]"
          label="Filter Criticality"
          density="compact"
          hide-details
          style="max-width: 200px;"
          variant="outlined"
          rounded="lg"
        ></v-select>
        <!-- Sort Control -->
        <v-select
          v-model="sortBy"
          :items="[
            { title: 'Default Sort', value: 'default' },
            { title: 'Sort by Criticality', value: 'criticality' }
          ]"
          label="Sort By"
          density="compact"
          hide-details
          style="max-width: 200px;"
          variant="outlined"
          rounded="lg"
        ></v-select>
        <v-text-field
          v-model="searchOrders"
          label="Search orders..."
          prepend-inner-icon="mdi-magnify"
          density="compact"
          hide-details
          style="max-width: 200px;"
          variant="outlined"
          rounded="lg"
        ></v-text-field>
        <v-btn icon="mdi-refresh" variant="text" @click="fetchData" :loading="serviceStore.loading"></v-btn>
      </div>
    </v-card>

    <v-window v-model="viewMode">

      <!-- ============================
           KANBAN VIEW
           ============================ -->
      <v-window-item value="kanban">
        <div class="kanban-container mt-4">
          <v-row class="kanban-row flex-nowrap overflow-x-auto pb-4">

            <!-- 1. PENDING -->
            <v-col class="kanban-col">
              <div class="kanban-header kanban-header--pending mb-4">
                <v-icon icon="mdi-clock-outline" size="18" class="mr-2"></v-icon>
                <span class="text-subtitle-2 font-weight-bold">Pending</span>
                <v-chip size="x-small" class="ml-auto font-weight-bold" color="grey">{{ groupedOrders.Pending.length }}</v-chip>
              </div>
              <v-slide-y-transition group>
                <v-card v-for="order in groupedOrders.Pending" :key="order.id" class="mb-3 order-card" :class="'criticality-border-' + order.criticality" border>
                  <v-card-text class="pa-3">
                    <div class="d-flex justify-space-between align-center mb-2">
                      <span class="text-caption font-weight-bold opacity-50">#{{ order.id }}</span>
                      <div class="d-flex align-center gap-1">
                        <v-chip size="x-small" color="deep-purple" variant="tonal" class="font-weight-bold">{{ order.ServiceType?.name }}</v-chip>
                        <v-icon
                          :color="order.criticality === 'Critical' ? 'error' : (order.criticality === 'Moderate' ? 'orange' : 'success')"
                          size="small"
                          :title="'Priority: ' + order.criticality"
                        >mdi-lightbulb-on</v-icon>
                      </div>
                    </div>
                    <div class="text-body-2 font-weight-bold mb-1">{{ order.Customer?.name }}</div>

                    <!-- Card details -->
                    <div class="text-caption text-grey mb-2">
                      <div>Created: {{ formatDate(order.created_at) }}</div>
                      <div>Assigned: {{ order.notes || 'Unassigned' }}</div>
                    </div>

                    <!-- Invoice Badge -->
                    <v-chip
                      v-if="hasInvoice(order)"
                      color="success"
                      size="x-small"
                      prepend-icon="mdi-receipt-check"
                      variant="tonal"
                      class="font-weight-bold mb-2 cursor-pointer"
                      @click.stop="openInvoiceView(order.Invoice)"
                    >{{ order.Invoice?.invoice_number }}</v-chip>
                    <v-chip
                      v-else
                      color="orange"
                      size="x-small"
                      prepend-icon="mdi-receipt-outline"
                      variant="tonal"
                      class="font-weight-bold mb-2"
                    >Invoice Pending</v-chip>

                    <div class="d-flex gap-1 align-center mt-2">
                      <v-btn color="success" size="x-small" variant="text" @click.stop="openWhatsAppRemind(order)" class="px-1">
                        <v-icon icon="mdi-whatsapp" class="mr-1"></v-icon>
                        <span class="text-caption font-weight-bold">{{ order.reminder_count || 0 }}</span>
                      </v-btn>
                      <v-btn
                        v-if="auth.can('services', 'write')"
                        color="primary" block variant="tonal" size="small"
                        append-icon="mdi-play-circle-outline"
                        @click.stop="updateStatus(order, 'In Progress')"
                        class="ml-1"
                      >Start Service</v-btn>
                    </div>
                    <div class="d-flex justify-end mt-2 pt-2 border-t">
                      <v-btn v-if="auth.can('services', 'write')" icon="mdi-close-circle-outline" variant="text" size="x-small" color="warning" class="mr-1" title="Cancel Order" @click.stop="updateStatus(order, 'Cancelled')"></v-btn>
                      <v-btn v-if="auth.can('services', 'write') && !hasInvoice(order)" icon="mdi-pencil-outline" variant="text" size="x-small" color="primary" class="mr-1" @click.stop="openEditOrderForm(order)"></v-btn>
                      <v-btn v-if="auth.can('services', 'delete')" icon="mdi-delete-outline" variant="text" size="x-small" color="error" @click.stop="confirmDeleteOrder(order)"></v-btn>
                    </div>
                  </v-card-text>
                </v-card>
              </v-slide-y-transition>
              <div v-if="groupedOrders.Pending.length === 0" class="empty-col">No pending orders</div>
            </v-col>

            <!-- 2. IN PROGRESS -->
            <v-col class="kanban-col">
              <div class="kanban-header kanban-header--inprogress mb-4">
                <v-icon icon="mdi-progress-clock" size="18" class="mr-2"></v-icon>
                <span class="text-subtitle-2 font-weight-bold">In Progress</span>
                <v-chip size="x-small" class="ml-auto font-weight-bold" color="primary">{{ groupedOrders['In Progress'].length }}</v-chip>
              </div>
              <v-slide-y-transition group>
                <v-card v-for="order in groupedOrders['In Progress']" :key="order.id" class="mb-3 order-card" :class="'criticality-border-' + order.criticality" border>
                  <v-card-text class="pa-3">
                    <div class="d-flex justify-space-between align-center mb-2">
                      <span class="text-caption font-weight-bold opacity-50">#{{ order.id }}</span>
                      <div class="d-flex align-center gap-1">
                        <v-chip size="x-small" color="deep-purple" variant="tonal" class="font-weight-bold">{{ order.ServiceType?.name }}</v-chip>
                        <v-icon
                          :color="order.criticality === 'Critical' ? 'error' : (order.criticality === 'Moderate' ? 'orange' : 'success')"
                          size="small"
                          :title="'Priority: ' + order.criticality"
                        >mdi-lightbulb-on</v-icon>
                      </div>
                    </div>
                    <div class="text-body-2 font-weight-bold mb-1">{{ order.Customer?.name }}</div>

                    <!-- Card details -->
                    <div class="text-caption text-grey mb-2">
                      <div>Created: {{ formatDate(order.created_at) }}</div>
                      <div>Assigned: {{ order.notes || 'Unassigned' }}</div>
                    </div>

                    <!-- Invoice Badge -->
                    <v-chip
                      v-if="hasInvoice(order)"
                      color="success"
                      size="x-small"
                      prepend-icon="mdi-receipt-check"
                      variant="tonal"
                      class="font-weight-bold mb-2 cursor-pointer"
                      @click.stop="openInvoiceView(order.Invoice)"
                    >{{ order.Invoice?.invoice_number }}</v-chip>
                    <v-chip
                      v-else
                      color="orange"
                      size="x-small"
                      prepend-icon="mdi-receipt-outline"
                      variant="tonal"
                      class="font-weight-bold mb-2"
                    >Invoice Pending</v-chip>

                    <div class="text-caption text-grey mb-2">
                      <v-icon size="x-small" icon="mdi-calendar-play-outline" class="mr-1"></v-icon>
                      Started: {{ formatDate(order.started_at) }}
                    </div>
                    <div class="d-flex gap-1 align-center mt-2">
                      <v-btn color="success" size="x-small" variant="text" @click.stop="openWhatsAppRemind(order)" class="px-1">
                        <v-icon icon="mdi-whatsapp" class="mr-1"></v-icon>
                        <span class="text-caption font-weight-bold">{{ order.reminder_count || 0 }}</span>
                      </v-btn>
                      <v-btn
                        v-if="auth.can('services', 'write')"
                        color="success" block variant="flat" size="small"
                        append-icon="mdi-check-circle-outline"
                        @click.stop="confirmOrderCompletion(order)"
                        class="ml-1"
                      >Complete Service</v-btn>
                    </div>
                    <div class="d-flex justify-end mt-2 pt-2 border-t">
                      <v-btn v-if="auth.can('services', 'write')" icon="mdi-close-circle-outline" variant="text" size="x-small" color="warning" class="mr-1" title="Cancel Order" @click.stop="updateStatus(order, 'Cancelled')"></v-btn>
                      <v-btn v-if="auth.can('services', 'write') && !hasInvoice(order)" icon="mdi-pencil-outline" variant="text" size="x-small" color="primary" @click.stop="openEditOrderForm(order)"></v-btn>
                    </div>
                  </v-card-text>
                </v-card>
              </v-slide-y-transition>
              <div v-if="groupedOrders['In Progress'].length === 0" class="empty-col">No services in progress</div>
            </v-col>

            <!-- 3. COMPLETED — INVOICE PENDING -->
            <v-col class="kanban-col">
              <div class="kanban-header kanban-header--invoice-pending mb-4">
                <v-icon icon="mdi-receipt-text-clock-outline" size="18" class="mr-2"></v-icon>
                <span class="text-subtitle-2 font-weight-bold">Completed — Invoice Pending</span>
                <v-chip size="x-small" class="ml-auto font-weight-bold" color="orange">{{ groupedOrders.CompletedInvoicePending.length }}</v-chip>
              </div>
              <v-slide-y-transition group>
                <v-card v-for="order in groupedOrders.CompletedInvoicePending" :key="order.id" class="mb-3 order-card" border>
                  <v-card-text class="pa-3">
                    <div class="d-flex justify-space-between align-center mb-2">
                      <span class="text-caption font-weight-bold opacity-50">#{{ order.id }}</span>
                      <v-chip size="x-small" color="deep-purple" variant="tonal" class="font-weight-bold">{{ order.ServiceType?.name }}</v-chip>
                    </div>
                    <div class="text-body-2 font-weight-bold mb-1">{{ order.Customer?.name }}</div>

                    <!-- Card details -->
                    <div class="text-caption text-grey mb-2">
                      <div>Created: {{ formatDate(order.created_at) }}</div>
                      <div>Assigned: {{ order.notes || 'Unassigned' }}</div>
                    </div>

                    <!-- Invoice Badge -->
                    <v-chip
                      :color="hasInvoice(order) ? 'success' : 'orange'"
                      size="x-small"
                      :prepend-icon="hasInvoice(order) ? 'mdi-receipt-check' : 'mdi-receipt-outline'"
                      variant="tonal"
                      class="font-weight-bold mb-2"
                    >{{ hasInvoice(order) ? 'Invoice Created' : 'Invoice Pending' }}</v-chip>

                    <div class="text-caption text-grey mb-2">
                      <v-icon size="x-small" icon="mdi-check-all" color="success" class="mr-1"></v-icon>
                      Completed: {{ formatDate(order.completed_at) }}
                    </div>
                    <div class="d-flex gap-1 align-center mt-2">
                      <v-btn color="success" size="x-small" variant="text" @click.stop="openWhatsAppRemind(order)" class="px-1">
                        <v-icon icon="mdi-whatsapp" class="mr-1"></v-icon>
                        <span class="text-caption font-weight-bold">{{ order.reminder_count || 0 }}</span>
                      </v-btn>
                      <v-btn
                        v-if="auth.can('invoices', 'write')"
                        color="orange" block variant="flat" size="small"
                        append-icon="mdi-receipt-text-plus"
                        @click.stop="triggerCreateInvoice(order)"
                        class="ml-1"
                      >Create Invoice</v-btn>
                    </div>
                    <div class="d-flex justify-between align-center mt-2 pt-2 border-t">
                      <v-btn v-if="auth.can('services', 'write')" variant="text" size="x-small" color="grey" prepend-icon="mdi-undo" @click.stop="revertOrder(order)">Revert</v-btn>
                    </div>
                  </v-card-text>
                </v-card>
              </v-slide-y-transition>
              <div v-if="groupedOrders.CompletedInvoicePending.length === 0" class="empty-col">No orders awaiting invoice</div>
            </v-col>

            <!-- 4. COMPLETED — INVOICE CREATED -->
            <v-col class="kanban-col">
              <div class="kanban-header kanban-header--done mb-4">
                <v-icon icon="mdi-check-decagram-outline" size="18" class="mr-2"></v-icon>
                <span class="text-subtitle-2 font-weight-bold">Completed — Invoice Created</span>
                <v-chip size="x-small" class="ml-auto font-weight-bold" color="success">{{ groupedOrders.CompletedInvoiceCreated.length }}</v-chip>
              </div>
              <v-slide-y-transition group>
                <v-card v-for="order in groupedOrders.CompletedInvoiceCreated" :key="order.id" class="mb-3 order-card opacity-80" border>
                  <v-card-text class="pa-3">
                    <div class="d-flex justify-space-between align-center mb-2">
                      <span class="text-caption font-weight-bold opacity-50">#{{ order.id }}</span>
                      <v-chip size="x-small" color="deep-purple" variant="tonal" class="font-weight-bold">{{ order.ServiceType?.name }}</v-chip>
                    </div>
                    <div class="text-body-2 font-weight-bold mb-1 opacity-70">{{ order.Customer?.name }}</div>

                    <!-- Card details -->
                    <div class="text-caption text-grey mb-2">
                      <div>Created: {{ formatDate(order.created_at) }}</div>
                      <div>Assigned: {{ order.notes || 'Unassigned' }}</div>
                    </div>

                    <!-- Invoice Badge -->
                    <v-chip
                      v-if="hasInvoice(order)"
                      color="success"
                      size="x-small"
                      prepend-icon="mdi-receipt-check"
                      variant="tonal"
                      class="font-weight-bold mb-2 cursor-pointer"
                      @click.stop="openInvoiceView(order.Invoice)"
                    >{{ order.Invoice?.invoice_number }}</v-chip>
                    <v-chip
                      v-else
                      color="orange"
                      size="x-small"
                      prepend-icon="mdi-receipt-outline"
                      variant="tonal"
                      class="font-weight-bold mb-2"
                    >Invoice Pending</v-chip>

                    <div class="d-flex justify-space-between align-center mt-2 pt-2 border-t">
                      <v-btn v-if="auth.can('services', 'write')" variant="text" size="x-small" color="grey" prepend-icon="mdi-undo" @click.stop="revertOrder(order)">Revert</v-btn>
                      <v-btn color="primary" variant="text" size="x-small" append-icon="mdi-arrow-right" to="/invoices">Invoices</v-btn>
                    </div>
                  </v-card-text>
                </v-card>
              </v-slide-y-transition>
              <div v-if="groupedOrders.CompletedInvoiceCreated.length === 0" class="empty-col">No fully completed orders</div>
            </v-col>

            <!-- 5. CANCELLED -->
            <v-col class="kanban-col">
              <div class="kanban-header kanban-header--cancelled mb-4">
                <v-icon icon="mdi-cancel" size="18" class="mr-2"></v-icon>
                <span class="text-subtitle-2 font-weight-bold">Cancelled</span>
                <v-chip size="x-small" class="ml-auto font-weight-bold" color="error">{{ groupedOrders.Cancelled.length }}</v-chip>
              </div>
              <v-slide-y-transition group>
                <v-card v-for="order in groupedOrders.Cancelled" :key="order.id" class="mb-3 order-card grayscale opacity-60" border>
                  <v-card-text class="pa-3">
                    <div class="d-flex justify-space-between align-center mb-2">
                      <span class="text-caption font-weight-bold opacity-50">#{{ order.id }}</span>
                      <v-chip size="x-small" color="error" variant="flat">Cancelled</v-chip>
                    </div>
                    <div class="text-body-2 font-weight-bold mb-1">{{ order.Customer?.name }}</div>

                    <!-- Card details -->
                    <div class="text-caption text-grey mb-2">
                      <div>Created: {{ formatDate(order.created_at) }}</div>
                      <div>Assigned: {{ order.notes || 'Unassigned' }}</div>
                    </div>

                    <div class="d-flex justify-end mt-2 pt-2 border-t">
                      <v-btn v-if="auth.can('services', 'write')" variant="text" size="x-small" prepend-icon="mdi-restore" @click.stop="updateStatus(order, 'Pending')">Restore</v-btn>
                    </div>
                  </v-card-text>
                </v-card>
              </v-slide-y-transition>
              <div v-if="groupedOrders.Cancelled.length === 0" class="empty-col">No cancelled orders</div>
            </v-col>

          </v-row>
        </div>
      </v-window-item>

      <!-- ============================
           LIST VIEW
           ============================ -->
      <v-window-item value="list">
        <v-card class="border mt-4" border>
          <v-data-table :headers="orderHeaders" :items="filteredOrders" :loading="serviceStore.loading" hover>

            <template v-slot:item.ServiceType="{ item }">
              <div class="font-weight-bold d-flex align-center gap-2">
                {{ item.ServiceType?.name }}
                <v-icon
                  :color="item.criticality === 'Critical' ? 'error' : (item.criticality === 'Moderate' ? 'orange' : 'success')"
                  size="small"
                  :title="'Priority: ' + item.criticality"
                >mdi-lightbulb-on</v-icon>
              </div>
              <div class="text-caption text-grey">{{ item.ServiceType?.category }}</div>
            </template>

            <template v-slot:item.Customer="{ item }">
              <div class="font-weight-bold">{{ item.Customer?.name }}</div>
              <div class="text-caption text-grey">{{ item.Customer?.phone_whatsapp }}</div>
            </template>

            <template v-slot:item.created_at="{ item }">{{ formatDate(item.created_at) }}</template>

            <!-- Invoice Badge column -->
            <template v-slot:item.invoice_badge="{ item }">
              <v-chip
                v-if="hasInvoice(item)"
                color="success"
                size="x-small"
                prepend-icon="mdi-receipt-check"
                variant="tonal"
                class="font-weight-bold cursor-pointer"
                @click="openInvoiceView(item.Invoice)"
              >{{ item.Invoice?.invoice_number }}</v-chip>
              <v-chip
                v-else
                color="orange"
                size="x-small"
                prepend-icon="mdi-receipt-outline"
                variant="tonal"
                class="font-weight-bold"
              >Invoice Pending</v-chip>
            </template>

            <template v-slot:item.status="{ item }">
              <v-chip :color="getStatusColor(item.status)" size="x-small" label class="font-weight-bold">
                <template v-if="item.status === 'CompletedInvoicePending'">Completed – Inv. Pending</template>
                <template v-else-if="item.status === 'CompletedInvoiceCreated'">Completed – Inv. Created</template>
                <template v-else>{{ item.status }}</template>
              </v-chip>
              <div v-if="item.status === 'CompletedInvoiceCreated' && hasInvoice(item)" class="mt-1">
                <span 
                  class="text-caption text-primary font-weight-black cursor-pointer text-decoration-underline d-inline-flex align-center"
                  @click="openInvoiceView(item.Invoice)"
                >
                  <v-icon size="x-small" icon="mdi-receipt-text-outline" class="mr-1"></v-icon>
                  {{ item.Invoice?.invoice_number }}
                </span>
              </div>
            </template>

            <template v-slot:item.actions="{ item }">
              <v-btn variant="text" size="small" color="success" @click="openWhatsAppRemind(item)" class="px-2">
                <v-icon icon="mdi-whatsapp" class="mr-1"></v-icon>
                <span class="text-caption font-weight-bold">{{ item.reminder_count || 0 }}</span>
              </v-btn>
              <v-btn
                v-if="['Pending', 'In Progress'].includes(item.status) && auth.can('services', 'write') && !hasInvoice(item)"
                icon="mdi-pencil-outline"
                variant="text"
                size="small"
                color="primary"
                title="Edit"
                @click="openEditOrderForm(item)"
              ></v-btn>
              <v-btn
                v-if="item.status === 'Pending' && auth.can('services', 'write')"
                prepend-icon="mdi-play-circle-outline"
                variant="tonal"
                size="x-small"
                color="primary"
                class="mr-1"
                @click="updateStatus(item, 'In Progress')"
              >Start Service</v-btn>
              <v-btn
                v-if="item.status === 'In Progress' && auth.can('services', 'write')"
                prepend-icon="mdi-check-circle-outline"
                variant="tonal"
                size="x-small"
                color="success"
                class="mr-1"
                @click="confirmOrderCompletion(item)"
              >Complete</v-btn>
              <v-btn
                v-if="['Pending', 'In Progress'].includes(item.status) && auth.can('services', 'write')"
                prepend-icon="mdi-close-circle-outline"
                variant="tonal"
                size="x-small"
                color="warning"
                class="mr-1"
                @click="updateStatus(item, 'Cancelled')"
              >Cancel</v-btn>
              <v-btn
                v-if="item.status === 'CompletedInvoicePending' && auth.can('invoices', 'write')"
                prepend-icon="mdi-receipt-text-plus"
                variant="flat"
                size="x-small"
                color="orange"
                class="mr-1"
                @click="triggerCreateInvoice(item)"
              >Create Invoice</v-btn>
              <v-btn
                v-if="['CompletedInvoicePending', 'CompletedInvoiceCreated'].includes(item.status) && auth.can('services', 'write')"
                prepend-icon="mdi-undo"
                variant="tonal"
                size="x-small"
                color="grey"
                class="mr-1"
                @click="revertOrder(item)"
              >Revert</v-btn>
              <v-btn
                v-if="item.status === 'Cancelled' && auth.can('services', 'write')"
                prepend-icon="mdi-restore"
                variant="tonal"
                size="x-small"
                color="primary"
                class="mr-1"
                @click="updateStatus(item, 'Pending')"
              >Restore</v-btn>
              <v-btn v-if="auth.can('services', 'delete')" icon="mdi-delete-outline" variant="text" size="small" color="error" title="Delete" @click="confirmDeleteOrder(item)"></v-btn>
            </template>

          </v-data-table>
        </v-card>
      </v-window-item>

    </v-window>

    <!-- DIALOGS -->
    <v-dialog v-model="orderDialog" max-width="600px" persistent>
      <ServiceOrderForm
        v-if="orderDialog"
        :service-types="activeServiceTypes"
        :loading="serviceStore.loading"
        :order="editingOrder"
        @save="saveOrder"
        @cancel="closeOrderForm"
      />
    </v-dialog>

    <v-dialog v-model="invoiceDialog" max-width="90vw" persistent>
      <InvoiceDialog
        v-if="invoiceDialog"
        :prefilled-service-order-id="prefilledServiceOrderId"
        @save="onInvoiceSaved"
        @cancel="invoiceDialog = false"
      />
    </v-dialog>

    <!-- Settings Dialog -->
    <v-dialog v-model="settingsDialog" max-width="500px" persistent>
      <ServiceSettingsDialog
        v-if="settingsDialog"
        @close="settingsDialog = false"
        @success="onSettingsSuccess"
        @error="onSettingsError"
      />
    </v-dialog>

    <!-- Invoice Detail View -->
    <v-dialog v-model="viewDialog" max-width="900px">
      <InvoiceDetailView
        v-if="viewDialog"
        :invoice-id="selectedViewInvoice?.id"
        @close="viewDialog = false"
      />
    </v-dialog>

    <ConfirmDialog
      v-model="confirmDialog.show"
      :title="confirmDialog.title"
      :message="confirmDialog.message"
      :confirm-text="confirmDialog.confirmText"
      color="success"
      icon="mdi-check-circle-outline"
      :loading="serviceStore.loading"
      @confirm="executeOrderCompletion"
    />

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="4000">
      {{ snackbar.text }}
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useServiceStore } from '~/stores/services';
import { useAuthStore } from '~/stores/auth';
import ServiceOrderForm from '~/components/services/ServiceOrderForm.vue';
import ServiceSettingsDialog from '~/components/services/ServiceSettingsDialog.vue';
import ConfirmDialog from '~/components/common/ConfirmDialog.vue';
import InvoiceDialog from '~/components/invoices/InvoiceDialog.vue';
import InvoiceDetailView from '~/components/invoices/InvoiceDetailView.vue';
import { useWhatsApp } from '~/composables/useWhatsApp';

// ─── Stores ───────────────────────────────────────────────────────────────────
const serviceStore = useServiceStore();
const auth = useAuthStore();
const { openWhatsApp } = useWhatsApp();

// ─── UI State ─────────────────────────────────────────────────────────────────
const viewMode = ref('kanban');
const searchOrders = ref('');
const orderDialog = ref(false);
const invoiceDialog = ref(false);
const settingsDialog = ref(false);
const viewDialog = ref(false);
const prefilledServiceOrderId = ref(null);
const selectedOrderForCompletion = ref(null);
const selectedViewInvoice = ref(null);
const editingOrder = ref(null);

const sortBy = ref('default');
const criticalityFilter = ref('All');

const snackbar = reactive({ show: false, text: '', color: 'success' });
const confirmDialog = reactive({ show: false, title: '', message: '', confirmText: 'Confirm' });

// ─── Status Options ────────────────────────────────────────────────────────────
const statusOptions = [
  { title: 'Pending',                   value: 'Pending' },
  { title: 'In Progress',               value: 'In Progress' },
  { title: 'Completed – Inv. Pending',  value: 'CompletedInvoicePending' },
  { title: 'Completed – Inv. Created',  value: 'CompletedInvoiceCreated' },
  { title: 'Cancelled',                 value: 'Cancelled' },
];

// ─── Table Headers ─────────────────────────────────────────────────────────────
const orderHeaders = [
  { title: '#ID',      key: 'id',            width: '80px' },
  { title: 'Date',     key: 'created_at',    sortable: true },
  { title: 'Customer', key: 'Customer',      sortable: false },
  { title: 'Service',  key: 'ServiceType',   sortable: false },
  { title: 'Invoice',  key: 'invoice_badge', align: 'center', sortable: false },
  { title: 'Status',   key: 'status',        align: 'center', sortable: true },
  { title: 'Actions',  key: 'actions',       align: 'end',    sortable: false },
];

// Open the same InvoiceDetailView as in the invoice list
const openInvoiceView = (invoice) => {
  if (!invoice?.id) return;
  selectedViewInvoice.value = invoice;
  viewDialog.value = true;
};

// ─── Invoice Badge Helper ─────────────────────────────────────────────────────
const hasInvoice = (order) => {
  return order.Invoice && order.Invoice.id && order.Invoice.status !== 'Cancelled';
};

// ─── Computed ─────────────────────────────────────────────────────────────────
const filteredOrders = computed(() => {
  if (!searchOrders.value) return serviceStore.serviceOrders;
  const s = searchOrders.value.toLowerCase();
  return serviceStore.serviceOrders.filter(o =>
    o.Customer?.name?.toLowerCase().includes(s) ||
    o.ServiceType?.name?.toLowerCase().includes(s) ||
    String(o.id).includes(s)
  );
});

const activeServiceTypes = computed(() =>
  serviceStore.serviceTypes.filter(t => t.is_active)
);

const groupedOrders = computed(() => {
  const groups = {
    Pending: [],
    'In Progress': [],
    CompletedInvoicePending: [],
    CompletedInvoiceCreated: [],
    Cancelled: []
  };
  filteredOrders.value.forEach(o => {
    if (groups[o.status] !== undefined) groups[o.status].push(o);
  });
  return groups;
});

// ─── Lifecycle ────────────────────────────────────────────────────────────────
const fetchData = async () => {
  try {
    const { $api } = useNuxtApp();
    await $api.post('/services/orders/escalate');
  } catch (err) {
    console.error('Failed to run automatic criticality escalation', err);
  }

  const params = {};
  if (criticalityFilter.value !== 'All') {
    params.criticality = criticalityFilter.value;
  }
  if (sortBy.value === 'criticality') {
    params.sort = 'criticality';
  }
  await serviceStore.fetchServiceOrders(params);
  await serviceStore.fetchServiceTypes({ limit: 1000 });
};

onMounted(fetchData);

watch([sortBy, criticalityFilter], () => {
  fetchData();
});

// ─── Actions ──────────────────────────────────────────────────────────────────
const openOrderForm = () => {
  editingOrder.value = null;
  orderDialog.value = true;
};

const openEditOrderForm = (order) => {
  editingOrder.value = order;
  orderDialog.value = true;
};

const saveOrder = async (data) => {
  try {
    if (editingOrder.value) {
      await serviceStore.updateServiceOrder(editingOrder.value.id, data);
      showSnackbar('Service order updated successfully');
    } else {
      await serviceStore.createServiceOrder(data);
      showSnackbar('Service order created successfully');
    }
    closeOrderForm();
  } catch (err) {
    showSnackbar(err.message || 'Failed to save order', 'error');
  }
};

const closeOrderForm = () => {
  orderDialog.value = false;
  editingOrder.value = null;
};

const updateStatus = async (order, newStatus) => {
  if (newStatus === 'Completed') {
    return confirmOrderCompletion(order);
  }
  try {
    const res = await serviceStore.updateOrderStatus(order.id, newStatus);
    showSnackbar(res?.message || `Order moved to ${newStatus}`);
  } catch (err) {
    showSnackbar(err.message || 'Failed to update status', 'error');
    await serviceStore.fetchServiceOrders();
  }
};

// ─── Settings callbacks ──────────────────────────────────────────────────────
const onSettingsSuccess = (message) => {
  showSnackbar(message, 'success');
  fetchData();
};

const onSettingsError = (message) => {
  showSnackbar(message, 'error');
};

// ─── Completion Flow ──────────────────────────────────────────────────────────
const confirmOrderCompletion = (order) => {
  selectedOrderForCompletion.value = order;
  const invoiceExists = hasInvoice(order);
  confirmDialog.title = 'Complete Service?';
  confirmDialog.confirmText = 'Complete Service';
  confirmDialog.message = invoiceExists
    ? `Completing service for "${order.Customer?.name}".\n\nAn invoice already exists — the service will move to Completed – Invoice Created.`
    : `Completing service for "${order.Customer?.name}".\n\nNo invoice found — the service will move to Completed – Invoice Pending, where you can generate the invoice.`;
  confirmDialog.show = true;
};

const executeOrderCompletion = async () => {
  if (!selectedOrderForCompletion.value) return;
  try {
    const res = await serviceStore.updateOrderStatus(selectedOrderForCompletion.value.id, 'Completed');
    confirmDialog.show = false;
    showSnackbar(res?.message || 'Service completed!', 'success');
    selectedOrderForCompletion.value = null;
  } catch (err) {
    showSnackbar(err.message || 'Failed to complete order', 'error');
  }
};

// ─── Revert ───────────────────────────────────────────────────────────────────
const revertOrder = async (order) => {
  try {
    await serviceStore.updateOrderStatus(order.id, 'In Progress');
    showSnackbar('Service reverted to In Progress');
  } catch (err) {
    showSnackbar(err.message || 'Failed to revert', 'error');
  }
};

// ─── Delete ───────────────────────────────────────────────────────────────────
const confirmDeleteOrder = async (order) => {
  if (confirm(`Delete Service Order #${order.id}?`)) {
    try {
      await serviceStore.deleteServiceOrder(order.id);
      showSnackbar('Order deleted');
    } catch (err) {
      showSnackbar('Failed to delete order', 'error');
    }
  }
};

// ─── Invoice Dialog ───────────────────────────────────────────────────────────
const triggerCreateInvoice = (order) => {
  prefilledServiceOrderId.value = order.id;
  invoiceDialog.value = true;
};

const onInvoiceSaved = () => {
  invoiceDialog.value = false;
  fetchData();
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const getStatusColor = (status) => {
  const map = {
    Pending:                 'grey',
    'In Progress':              'primary',
    CompletedInvoicePending: 'orange',
    CompletedInvoiceCreated: 'success',
    Cancelled:               'error',
  };
  return map[status] || 'grey';
};

const openWhatsAppRemind = async (order) => {
  const num = order.Customer?.phone_whatsapp;
  if (!num) return showSnackbar('Customer phone not found', 'warning');
  const msg = `Hi ${order.Customer?.name}, this is a reminder regarding your ${order.ServiceType?.name} service. Current status: ${order.status}.`;
  openWhatsApp(num, msg);

  try {
    await serviceStore.incrementReminderCount(order.id);
  } catch (err) {
    console.error('Failed to increment reminder count:', err);
  }
};

const formatDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-GB') + ' ' + dt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
};

const showSnackbar = (text, color = 'success') => {
  snackbar.text = text;
  snackbar.color = color;
  snackbar.show = true;
};
</script>

<style scoped>
.kanban-container { min-height: 500px; }
.kanban-row { scrollbar-width: thin; }
.kanban-col { min-width: 280px; max-width: 320px; }

.kanban-header {
  display: flex;
  align-items: center;
  padding: 8px 14px;
  border-radius: 10px;
  font-size: 13px;
  border: 1px solid rgba(0,0,0,0.08);
}
.kanban-header--pending         { background: rgba(var(--v-theme-surface-variant), 0.5); }
.kanban-header--inprogress      { background: rgba(var(--v-theme-primary), 0.08); border-color: rgba(var(--v-theme-primary), 0.2); }
.kanban-header--invoice-pending { background: rgba(255,152,0,0.08); border-color: rgba(255,152,0,0.3); }
.kanban-header--done            { background: rgba(var(--v-theme-success), 0.08); border-color: rgba(var(--v-theme-success), 0.2); }
.kanban-header--cancelled       { background: rgba(var(--v-theme-error), 0.06); border-color: rgba(var(--v-theme-error), 0.15); }

.empty-col { text-align: center; padding: 32px 0; font-size: 12px; opacity: 0.4; }
.grayscale  { filter: grayscale(1); }
.order-card { transition: all 0.18s ease; cursor: pointer; }
.order-card:hover { transform: translateY(-3px); border-color: rgb(var(--v-theme-primary)) !important; }
.opacity-80 { opacity: 0.8; }
.opacity-70 { opacity: 0.7; }
.opacity-60 { opacity: 0.6; }
.opacity-50 { opacity: 0.5; }

/* Criticality Indicator borders on left */
.criticality-border-Normal { border-left: 6px solid #4CAF50 !important; }
.criticality-border-Moderate { border-left: 6px solid #FF9800 !important; }
.criticality-border-Critical { border-left: 6px solid #F44336 !important; }
.cursor-pointer { cursor: pointer; }
</style>
