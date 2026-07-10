# DocClear Management System
## Full Architecture + Vibe-Coding Prompts
### Stack: Nuxt 3 · Node.js · MySQL · Vuetify (Material Design)

---

## TECH STACK DECISIONS

| Layer | Technology | Rationale |
|---|---|---|
| Frontend | Nuxt 3 (Vue 3 + Composition API) | SSR/SPA hybrid, file-based routing |
| UI Framework | Vuetify 3 | Material Design, rich data tables, form validation |
| Backend | Node.js + Express | REST API, lightweight, fast |
| ORM | Sequelize | MySQL-compatible, migrations, associations |
| Database | MySQL 8 | Relational, perfect for invoices/customers/docs |
| Auth | JWT + bcrypt | Stateless, secure |
| PDF | pdfkit | Invoice PDF generation |
| Validation | express-validator (BE) + Vuelidate (FE) | Dual-layer validation |
| WhatsApp | wa.me deep links | No API needed, opens native app |
| State | Pinia | Vue 3 native store |
| HTTP Client | Axios (Nuxt plugin) | Interceptors for auth tokens |

---

## PROJECT FOLDER STRUCTURE

```
docclear/
├── frontend/                        # Nuxt 3 app
│   ├── assets/
│   ├── components/
│   │   ├── common/                  # Shared: ConfirmDialog, StatusBadge, etc.
│   │   ├── customers/
│   │   ├── documents/
│   │   ├── invoices/
│   │   ├── services/
│   │   ├── expenses/
│   │   ├── wallet/
│   │   └── reports/
│   ├── layouts/
│   │   └── default.vue              # Sidebar + topbar shell
│   ├── pages/
│   │   ├── index.vue                # Dashboard
│   │   ├── customers/
│   │   │   ├── index.vue
│   │   │   └── [id].vue
│   │   ├── documents/index.vue
│   │   ├── services/index.vue
│   │   ├── invoices/
│   │   │   ├── index.vue
│   │   │   └── [id].vue
│   │   ├── expenses/index.vue
│   │   ├── wallet/index.vue
│   │   └── reports/index.vue
│   ├── plugins/
│   │   └── axios.js
│   ├── stores/
│   │   ├── auth.js
│   │   ├── customers.js
│   │   ├── documents.js
│   │   ├── services.js
│   │   ├── invoices.js
│   │   ├── expenses.js
│   │   ├── wallet.js
│   │   └── dashboard.js
│   ├── composables/
│   │   ├── useWhatsApp.js           # wa.me link builder
│   │   ├── useValidation.js
│   │   └── useNotify.js
│   ├── nuxt.config.ts
│   └── package.json
│
├── backend/                         # Node.js + Express
│   ├── config/
│   │   └── database.js              # Sequelize config
│   ├── models/
│   │   ├── index.js                 # Associations
│   │   ├── User.js
│   │   ├── Customer.js
│   │   ├── Document.js
│   │   ├── ServiceType.js
│   │   ├── ServiceOrder.js
│   │   ├── Invoice.js
│   │   ├── InvoiceItem.js
│   │   ├── Expense.js
│   │   └── WalletTransaction.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── customer.routes.js
│   │   ├── document.routes.js
│   │   ├── service.routes.js
│   │   ├── invoice.routes.js
│   │   ├── expense.routes.js
│   │   ├── wallet.routes.js
│   │   └── dashboard.routes.js
│   ├── controllers/
│   ├── middleware/
│   │   ├── auth.middleware.js
│   │   └── validate.middleware.js
│   ├── validators/
│   ├── utils/
│   │   └── pdfGenerator.js
│   ├── migrations/
│   ├── seeders/
│   ├── app.js
│   └── package.json
│
└── docker-compose.yml               # MySQL + backend + frontend
```

---

## DATABASE SCHEMA (MySQL)

```sql
-- Core tables and relationships

customers
  id, name, email, phone_whatsapp, address, city, country,
  trade_license_no, notes, created_at, updated_at

documents
  id, customer_id*, type (ENUM: Visa|Passport|TradeLicense|EmiratesID|MedicalFit|Other),
  doc_number, issue_date, expiry_date, notes, created_at, updated_at

service_types
  id, name, category, sell_price, cost_price, description, is_active, created_at

service_orders
  id, customer_id*, service_type_id*, status (ENUM: Pending|InProgress|Completed|Cancelled),
  notes, started_at, completed_at, created_at, updated_at

invoices
  id, invoice_number (unique), customer_id*, service_order_id*, subtotal,
  discount, tax, total, cost_total, status (ENUM: Draft|Sent|Paid|Overdue|Cancelled),
  due_date, paid_at, notes, created_at, updated_at

invoice_items
  id, invoice_id*, description, quantity, unit_price, cost_price, total

expenses
  id, description, category, amount, status (ENUM: Paid|Unpaid),
  payment_date, notes, created_at, updated_at

wallet_accounts
  id, name (Cash|Bank|Other), balance, currency (default AED), created_at

wallet_transactions
  id, from_account_id*, to_account_id*, amount, type (ENUM: Transfer|Income|Expense),
  reference_id, reference_type, notes, created_at

users
  id, name, email, password_hash, role (ENUM: Admin|Staff), is_active, created_at
```

**Key Relationships:**
- Customer → Documents (1:many)
- Customer → ServiceOrders (1:many)
- Customer → Invoices (1:many)
- ServiceOrder → Invoice (1:1)
- ServiceType → ServiceOrders (1:many)
- Invoice → InvoiceItems (1:many)
- WalletTransaction → WalletAccounts (many:1 from/to)

---

## CROSS-MODULE IMPACT MAP

This is critical. Before building each module, understand what it touches:

```
CUSTOMER deleted  →  cascade: Documents, ServiceOrders, Invoices
CUSTOMER phone    →  used in: WhatsApp links across Documents, Invoices, ServiceOrders
SERVICE completed →  triggers: Invoice auto-generation
INVOICE paid      →  triggers: WalletTransaction (income recorded to account)
EXPENSE paid      →  triggers: WalletTransaction (expense deducted from account)
DOCUMENT expiry   →  feeds: Dashboard "Expiring Soon" counter + Kanban/Calendar views
WALLET balance    →  derived from: all WalletTransactions (never store raw balance — compute)
REPORTS           →  reads from: Invoices (revenue), Expenses (cost), WalletTransactions
```

---

---
# VIBE-CODING PROMPTS
---

## ═══ PROMPT 0: PROJECT BOOTSTRAP ═══

```
You are building "DocClear" — a document clearing management system.

STACK:
- Frontend: Nuxt 3, Vue 3 Composition API, Vuetify 3 (Material Design)
- Backend: Node.js, Express 5, Sequelize ORM
- Database: MySQL 8
- State: Pinia
- Validation: express-validator (backend), Vuelidate (frontend)
- Auth: JWT + bcrypt

TASK: Scaffold the full project structure.

1. Create /backend with:
   - package.json with deps: express, sequelize, mysql2, bcryptjs, jsonwebtoken,
     express-validator, cors, dotenv, helmet, morgan, pdfkit, multer
   - app.js with Express setup, CORS, helmet, morgan, error handler middleware
   - config/database.js with Sequelize + MySQL config from .env
   - .env.example with: DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASS, JWT_SECRET,
     PORT, FRONTEND_URL
   - Folder structure: models/, routes/, controllers/, middleware/, validators/,
     utils/, migrations/

2. Create /frontend with:
   - Nuxt 3 project config (nuxt.config.ts) with Vuetify 3 module
   - package.json with deps: @nuxtjs/vuetify, pinia, @pinia/nuxt, axios, vuelidate,
     @vuelidate/core, @vuelidate/validators, dayjs
   - plugins/axios.js: Axios instance with baseURL from env, request interceptor
     to attach JWT from localStorage, response interceptor to handle 401 (redirect to login)
   - layouts/default.vue: Navigation drawer (sidebar) + top app bar + main content slot.
     Sidebar items: Dashboard, Customers, Documents, Services, Invoices,
     Expenses, Wallet, Reports. Use v-navigation-drawer, v-app-bar, v-main.
     Active state highlights current route. Company logo "DocClear" top of sidebar.
   - stores/auth.js (Pinia): state: user, token. actions: login, logout, checkAuth
   - pages/login.vue: Material Design login form with email + password,
     validation, error display, calls POST /api/auth/login

3. Create docker-compose.yml for MySQL 8 with persistent volume.

IMPORTANT RULES FOR ALL CODE IN THIS PROJECT:
- All API routes prefixed /api/v1/
- All responses: { success: true/false, data: {}, message: "", errors: [] }
- JWT in Authorization: Bearer header
- Frontend never hardcodes API URL — always uses NUXT_PUBLIC_API_BASE from .env
- All forms use Vuelidate for client-side validation before API call
- All tables use Vuetify v-data-table with server-side pagination
- Date formatting: always display DD/MM/YYYY, store ISO in DB
- Currency: AED prefix, toLocaleString() for display
- WhatsApp links: always format as https://wa.me/[country_code][number]
  stripping spaces, dashes, brackets from stored number
```

---

## ═══ PROMPT 1: AUTH MODULE ═══

```
Continuing DocClear (Nuxt 3 + Express + MySQL + Vuetify 3).

BUILD: Authentication Module

BACKEND:
1. models/User.js (Sequelize):
   Fields: id, name, email (unique), password_hash, role (ENUM Admin/Staff),
   is_active (default true), created_at, updated_at
   Instance method: validatePassword(plain) using bcrypt.compare
   Hook: beforeCreate/beforeUpdate — hash password if changed

2. middleware/auth.middleware.js:
   verifyToken(req, res, next) — validate JWT, attach req.user
   requireRole(...roles) — check req.user.role

3. validators/auth.validators.js (express-validator):
   loginValidator: email required+isEmail, password required minLength(6)
   registerValidator: name required, email unique check against DB,
   password minLength(8)+complexity, role in [Admin,Staff]

4. routes/auth.routes.js + controllers/auth.controller.js:
   POST /api/v1/auth/login — validate, find user, check password, return JWT+user
   POST /api/v1/auth/register — Admin only, create user
   GET  /api/v1/auth/me — return req.user profile
   PUT  /api/v1/auth/change-password — old password verify, new password hash+save

FRONTEND:
1. pages/login.vue:
   Vuetify card centered on page. Email + password fields.
   Vuelidate: email required+email format, password required.
   Show loading state on submit. Show error snackbar on failure.
   On success: save token to localStorage + pinia auth store, redirect to /

2. middleware/auth.global.ts (Nuxt):
   If route is not /login and no token → redirect to /login
   If route is /login and token exists → redirect to /

3. stores/auth.js (Pinia):
   state: { user: null, token: null }
   actions: login(credentials), logout(), fetchMe(), checkAuth()
   getters: isAdmin, isAuthenticated

VALIDATION RULES (enforce strictly):
- Email: required, valid format, max 100 chars
- Password: required, min 8 chars, at least 1 number
- Name: required, min 2 chars, max 100 chars
- Display field-level errors below each input using Vuetify hint/error prop
```

---

## ═══ PROMPT 2: CUSTOMER MODULE ═══

```
Continuing DocClear (Nuxt 3 + Express + MySQL + Vuetify 3).

BUILD: Customer Module

CROSS-MODULE IMPACTS:
- phone_whatsapp field is used across Documents, Invoices, ServiceOrders
  for WhatsApp links — must be stored in international format
- Deleting a customer must check for active ServiceOrders or unpaid Invoices
  and block deletion if any exist (soft-delete preferred)
- Customer name appears in Invoice headers and Document expiry reminders

BACKEND:
1. models/Customer.js (Sequelize):
   id, name (required), email, phone_whatsapp (required), address, city,
   country (default UAE), trade_license_no, notes,
   is_active (default true, soft delete), created_at, updated_at
   Associations: hasMany Documents, ServiceOrders, Invoices

2. validators/customer.validators.js:
   name: required, min 2, max 150
   email: optional but if provided must be valid format, max 100
   phone_whatsapp: required, must match pattern /^\+?[1-9]\d{7,14}$/
     (international format — show helper text: "Include country code e.g. +971501234567")
   city: optional, max 100
   country: optional, max 100
   trade_license_no: optional, max 50
   notes: optional, max 500

3. routes + controller (full CRUD):
   GET    /api/v1/customers        — list, pagination (page,limit), search (name,email,phone),
                                     filter (is_active), include document count + unpaid invoice count
   GET    /api/v1/customers/:id    — full profile: customer + documents + invoices + service orders
   POST   /api/v1/customers        — create with validation
   PUT    /api/v1/customers/:id    — update with validation
   DELETE /api/v1/customers/:id    — soft delete (set is_active=false).
                                     Block if has active service orders.
                                     Return warning count of unpaid invoices.

FRONTEND:
1. composables/useWhatsApp.js:
   Function: buildWhatsAppLink(phone, message = '')
   - Strip all non-digits except leading +
   - Remove leading 0 if present
   - Return: https://wa.me/[cleaned_number]?text=[encodeURIComponent(message)]
   - Export default preset messages:
     REMINDER_MSG: "Dear customer, this is a reminder about your document expiry..."
     INVOICE_MSG: "Dear customer, please find your invoice attached..."
     GENERAL_MSG: ""

2. pages/customers/index.vue:
   - v-data-table-server with columns: Name, Email, WhatsApp, City, Documents, Invoices, Status, Actions
   - Search bar (debounced 400ms) filters by name/email/phone
   - Floating action button (+) opens Create dialog
   - Each row: Edit icon, Delete icon (with confirm dialog), WhatsApp icon
   - WhatsApp icon: use buildWhatsAppLink(customer.phone_whatsapp) — open in new tab
   - Status chip: Active (green) / Inactive (grey)
   - Pagination: server-side

3. pages/customers/[id].vue — Customer Detail Page:
   - Tab layout with 4 tabs: Overview | Documents | Invoices | Service Orders
   - Overview: display all customer fields in v-card
   - Documents tab: list of customer's documents with expiry badge
   - Invoices tab: list with status + amount + WhatsApp share button per invoice
   - Service Orders tab: list with status timeline
   - Top right: Edit button, WhatsApp button (opens with general message)

4. components/customers/CustomerForm.vue:
   - Used for both Create and Edit (prop: customer object or null)
   - v-text-field for all fields
   - phone_whatsapp field: helper text shows "Format: +971501234567"
   - Real-time Vuelidate validation — show errors as user types (after blur)
   - On submit: emit 'saved' event with customer data

VALIDATION RULES:
- Name: required, 2-150 chars
- Email: optional, valid email if provided
- Phone/WhatsApp: required, international format (+XXXXXXXXXXX), 8-15 digits
- Show inline validation errors with red helper text
- Disable submit button if form is invalid
- Show success snackbar on save
- Show error snackbar with API error message on failure
```

---

## ═══ PROMPT 3: DOCUMENT MODULE ═══

```
Continuing DocClear (Nuxt 3 + Express + MySQL + Vuetify 3).

BUILD: Document Expiry Tracking Module

CROSS-MODULE IMPACTS:
- Dashboard reads documents to compute "Expiring Soon" count (≤30 days)
- Customer detail page [id].vue has a Documents tab — reuse DocumentList component
- WhatsApp reminder uses customer.phone_whatsapp from the Customer model
- Document types must stay in sync with any service type mappings

BACKEND:
1. models/Document.js (Sequelize):
   id, customer_id (FK → customers, CASCADE delete),
   type (ENUM: Visa, Passport, TradeLicense, EmiratesID, MedicalFitness, Other),
   doc_number, issue_date, expiry_date (required), notes,
   created_at, updated_at
   Associations: belongsTo Customer
   Virtual/computed: days_until_expiry (in getter or raw SQL)

2. validators/document.validators.js:
   customer_id: required, must exist in DB
   type: required, must be valid ENUM value
   doc_number: optional, max 100
   issue_date: optional, must be valid date, not in future
   expiry_date: required, valid date, must be after issue_date if provided
   notes: optional, max 500

3. routes + controller:
   GET  /api/v1/documents             — list with pagination, filters:
                                         customer_id, type, expiry_status
                                         (expired/critical/warning/ok)
                                         Returns customer name + phone_whatsapp joined
   GET  /api/v1/documents/expiring    — grouped by urgency:
                                         { critical: [], warning: [], month: [], safe: [] }
                                         critical = ≤7 days, warning = 8-14, month = 15-30
   GET  /api/v1/documents/:id         — single document with customer
   POST /api/v1/documents             — create
   PUT  /api/v1/documents/:id         — update
   DELETE /api/v1/documents/:id       — hard delete (no active orders depend on documents)

FRONTEND:
1. pages/documents/index.vue — Two view modes:

   KANBAN VIEW (default):
   - 4 columns: "🔴 Expired", "⚠️ Within 1 Week", "🔔 Within 2 Weeks", "📋 Within 1 Month", "✅ Safe"
   - Each card shows: Document type, Customer name, Doc number, Expiry date, Days remaining badge
   - Each card has a WhatsApp button: opens wa.me link for that customer with pre-filled message:
     "Dear [CustomerName], your [DocType] (No: [DocNumber]) expires on [ExpiryDate].
      Please contact us to initiate the renewal process."
   - Drag between columns NOT required (complexity vs value tradeoff)
   - Toggle button top-right to switch to Calendar view

   CALENDAR VIEW:
   - Show current month grid (7 columns = days of week)
   - Days with expiring documents show colored chips on the date cell
   - Chip color: red (expired/critical), amber (warning), green (safe)
   - Click a chip/date → show popover with document details + WhatsApp button
   - Month navigation: prev/next arrows

2. components/documents/DocumentCard.vue — reusable kanban card
3. components/documents/DocumentForm.vue — create/edit form:
   - v-select for customer (searchable autocomplete — fetch from /customers)
   - v-select for document type (ENUM values)
   - Date pickers for issue_date and expiry_date
   - Validation: expiry must be after issue date
   - Show days until expiry as helper text once expiry_date is set

VALIDATION:
- Customer: required (must select from list)
- Document type: required
- Expiry date: required, must be a valid future or past date (not blank)
- Issue date: if provided, must be before expiry date
- Doc number: optional, max 100 chars
- Prevent saving if expiry date < issue date — show inline error
```

---

## ═══ PROMPT 4: SERVICE MODULE ═══

```
Continuing DocClear (Nuxt 3 + Express + MySQL + Vuetify 3).

BUILD: Services & Workflow Module

CROSS-MODULE IMPACTS:
- When a ServiceOrder status → "Completed", automatically create a Draft Invoice
  (POST /api/v1/invoices with status: Draft, pre-populated from service_type pricing)
- ServiceOrder references customer — use customer.phone_whatsapp for WhatsApp links
- service_types.sell_price and cost_price flow into Invoice financials and Reports
- Dashboard "Active Services" count = ServiceOrders WHERE status IN (Pending, InProgress)

BACKEND:
1. models/ServiceType.js:
   id, name (required, unique), category, sell_price (DECIMAL 10,2),
   cost_price (DECIMAL 10,2), description, is_active (default true),
   created_at, updated_at

2. models/ServiceOrder.js:
   id, customer_id (FK), service_type_id (FK),
   status (ENUM: Pending, InProgress, Completed, Cancelled),
   notes, started_at, completed_at, created_at, updated_at
   Associations: belongsTo Customer, belongsTo ServiceType, hasOne Invoice

3. validators:
   ServiceType: name required unique, sell_price required positive number,
     cost_price required positive number, cost_price < sell_price (warn not block)
   ServiceOrder: customer_id required+exists, service_type_id required+exists,
     status valid ENUM, notes optional max 500

4. routes + controllers:
   ServiceTypes CRUD: GET/POST/PUT/DELETE /api/v1/service-types
   ServiceOrders:
     GET    /api/v1/service-orders     — list with pagination, filter by status/customer
                                         Join: customer name + phone, service type name + prices
     GET    /api/v1/service-orders/:id
     POST   /api/v1/service-orders     — create, default status: Pending
     PUT    /api/v1/service-orders/:id/status — advance status only
       Logic: Pending→InProgress sets started_at=NOW()
              InProgress→Completed sets completed_at=NOW()
              THEN: auto-create Invoice (status: Draft) linked to this order
                    Invoice items: 1 item = service name, qty 1, unit_price=sell_price,
                    cost_price=cost_price
     DELETE /api/v1/service-orders/:id — only if status=Pending or Cancelled

FRONTEND:
1. pages/services/index.vue — Two sections:

   SECTION A: Service Catalog (top half)
   - v-data-table: Name, Category, Sell Price (AED), Cost Price (AED), Profit (computed), Status, Actions
   - Edit inline or in dialog, toggle is_active
   - Add new service type via FAB → dialog with form
   - Profit column: sell - cost, colored green if positive

   SECTION B: Service Workflow (bottom half) — Kanban board
   - 3 columns: Pending | In Progress | Completed
   - Cards show: Customer name, Service name, Started date, Assignee (notes field)
   - Each card has action button: "Start →" (Pending→InProgress), "Complete ✓" (InProgress→Completed)
   - On Complete: show confirm dialog "This will auto-generate a Draft Invoice. Continue?"
   - After completion: show snackbar "Invoice INV-XXXX created as Draft"
   - WhatsApp button on each card using customer phone

2. components/services/ServiceOrderForm.vue:
   - Autocomplete for customer (search by name)
   - Select for service type (shows name + price)
   - Notes textarea
   - Show profit preview: "You will earn AED X on this service"

VALIDATION:
- Sell price: required, > 0, numeric
- Cost price: required, > 0, numeric
- If cost_price >= sell_price: show warning "Cost equals or exceeds selling price"
  (don't block save — business may have valid reason)
- Service name: required, unique (check on blur via API)
- Order customer: required
- Order service type: required
```

---

## ═══ PROMPT 5: INVOICE MODULE ═══

```
Continuing DocClear (Nuxt 3 + Express + MySQL + Vuetify 3).

BUILD: Invoice Module

CROSS-MODULE IMPACTS:
- Invoice is auto-created (Draft) when ServiceOrder → Completed (Prompt 4)
- When Invoice status → Paid: auto-create WalletTransaction (type: Income)
  recording the total amount into the default Cash or Bank account
  (add a "Received Into" account selector when marking paid)
- Invoice total feeds into Reports (revenue) and Dashboard (net profit)
- Invoice uses customer.phone_whatsapp for WhatsApp share link
- invoice_number must be auto-generated sequentially: INV-YYYY-XXXX

BACKEND:
1. models/Invoice.js + models/InvoiceItem.js (already defined in schema)

2. Invoice number generation utility:
   getNextInvoiceNumber() — query MAX invoice_number for current year, increment
   Format: INV-2025-0001, INV-2025-0002, etc.

3. validators/invoice.validators.js:
   customer_id: required, exists
   items: array, min 1 item
   item.description: required, max 200
   item.quantity: required, integer, min 1
   item.unit_price: required, > 0
   due_date: optional, valid date
   discount: optional, 0-100 (percentage) or flat amount
   status: valid ENUM
   notes: optional, max 500

4. routes + controllers:
   GET    /api/v1/invoices           — list, pagination, filter: status, customer_id,
                                       date_from, date_to. Include customer name+phone.
   GET    /api/v1/invoices/:id       — full invoice with items + customer
   POST   /api/v1/invoices           — create (manual or auto from service order)
   PUT    /api/v1/invoices/:id       — update (only if status=Draft)
   PUT    /api/v1/invoices/:id/status — change status
     If Paid:
       - set paid_at = NOW()
       - CREATE WalletTransaction: type=Income, to_account_id=req.body.account_id,
         amount=invoice.total, reference_id=invoice.id, reference_type='Invoice'
   DELETE /api/v1/invoices/:id       — only if status=Draft
   GET    /api/v1/invoices/:id/pdf   — generate PDF using pdfkit, return buffer

5. PDF Generator (utils/pdfGenerator.js):
   - Company header: DocClear Management
   - Invoice number, date, due date
   - Customer details block
   - Items table: description, qty, unit price, total
   - Subtotal, discount, tax (if any), TOTAL (bold)
   - Footer: "Thank you for your business"
   - Return Buffer for download

FRONTEND:
1. pages/invoices/index.vue:
   - v-data-table-server: Invoice#, Customer, Service, Amount, Cost, Profit, Status, Date, Actions
   - Filter chips: All | Draft | Sent | Paid | Overdue
   - Status colors: Draft=grey, Sent=blue, Paid=green, Overdue=red, Cancelled=grey
   - Row actions: View, Download PDF, Share via WhatsApp, Mark Paid (if Sent/Overdue)
   - WhatsApp share: buildWhatsAppLink(phone, "Dear [name], your invoice [INV#] for AED [total] is ready.")
   - FAB: Create Manual Invoice

2. pages/invoices/[id].vue — Invoice Detail:
   - Invoice preview styled like a real invoice (card layout)
   - Customer info block (left) + Invoice meta block (right)
   - Items table with subtotal/total section
   - Action toolbar: Download PDF, Share WhatsApp, Change Status
   - "Mark as Paid" button → dialog with account selector (Cash/Bank)

3. components/invoices/InvoiceForm.vue:
   - Customer autocomplete
   - Dynamic items list: add/remove rows (description, qty, price, line total)
   - Discount field (optional)
   - Auto-compute subtotal, discount amount, total in real-time
   - Notes textarea
   - due_date picker

VALIDATION:
- At least 1 line item required
- Each item: description required, qty ≥ 1, price > 0
- Prevent editing invoices that are not Draft
- Prevent deleting paid invoices
- Show running total as items are added
- Disable Mark Paid if already Paid
```

---

## ═══ PROMPT 6: EXPENSE MODULE ═══

```
Continuing DocClear (Nuxt 3 + Express + MySQL + Vuetify 3).

BUILD: Expense Tracking Module

CROSS-MODULE IMPACTS:
- When Expense status → Paid: auto-create WalletTransaction (type: Expense)
  deducting amount from selected wallet account
- Expense totals feed into Reports (cost side) and Dashboard (net profit)
- expense.category should match or complement service cost categories for clean reporting

BACKEND:
1. models/Expense.js:
   id, description (required), category (optional, max 100),
   amount (DECIMAL 10,2, required, > 0),
   status (ENUM: Paid, Unpaid, default Unpaid),
   payment_date (nullable, set when marked Paid),
   account_id (FK → wallet_accounts, nullable — set when paid),
   notes (max 500), created_at, updated_at

2. validators/expense.validators.js:
   description: required, min 3, max 200
   amount: required, > 0, numeric
   category: optional, max 100
   status: valid ENUM
   payment_date: if status=Paid, payment_date required and valid date

3. routes + controllers:
   GET    /api/v1/expenses         — list, pagination, filter: status, category,
                                     date_from, date_to. Total summary in response meta.
   GET    /api/v1/expenses/:id
   POST   /api/v1/expenses         — create
   PUT    /api/v1/expenses/:id     — update (all fields)
   PUT    /api/v1/expenses/:id/pay — mark as paid
     Requires: account_id in body
     Sets: status=Paid, payment_date=NOW()
     Creates: WalletTransaction (type=Expense, from_account=account_id, amount)
   DELETE /api/v1/expenses/:id     — only if status=Unpaid

FRONTEND:
1. pages/expenses/index.vue:
   - Summary cards row: Total Expenses | Total Paid | Total Unpaid (computed from list)
   - v-data-table-server: Description, Category, Amount, Status, Payment Date, Actions
   - Filter toggle: All | Paid | Unpaid
   - Status chip: Paid=green, Unpaid=red
   - Actions: Edit, Delete (unpaid only), "Mark Paid" button
   - "Mark Paid" → dialog: choose account (Cash/Bank dropdown), confirm amount, date
   - FAB: Add Expense

2. components/expenses/ExpenseForm.vue:
   - Description field (required)
   - Category field (v-combobox — type or pick from presets:
     "Government Fees", "Rent", "PRO Charges", "Typing Fees", "Utilities", "Salary", "Other")
   - Amount field (numeric, AED prefix)
   - Notes textarea
   - Vuelidate validation on all required fields

3. components/expenses/MarkPaidDialog.vue:
   - Shows expense description + amount
   - Account selector: fetch from /api/v1/wallet/accounts
   - Payment date picker (default today)
   - Confirm / Cancel buttons

VALIDATION:
- Description: required, min 3 chars
- Amount: required, must be positive number
- Category: optional
- When marking paid: account_id required, payment_date required
- Show "Insufficient balance" warning if account balance < expense amount
  (fetch account balance, compare client-side before submit)
- Prevent deletion of Paid expenses
```

---

## ═══ PROMPT 7: WALLET MODULE ═══

```
Continuing DocClear (Nuxt 3 + Express + MySQL + Vuetify 3).

BUILD: Wallet & Accounts Module

CROSS-MODULE IMPACTS:
- WalletTransactions are auto-created by Invoice (Paid) and Expense (Paid) flows
- Account balances must be computed from transactions — NEVER store static balance
  (prevents sync bugs across modules)
- Reports page reads wallet data for cash flow visualization
- All "Mark Paid" flows in Invoices + Expenses require account list from this module

BACKEND:
1. models/WalletAccount.js:
   id, name (required, unique: Cash, Bank, Other), currency (default AED),
   description, is_active (default true), created_at

2. models/WalletTransaction.js:
   id, account_id (FK — the account affected),
   type (ENUM: Income, Expense, Transfer),
   direction (ENUM: In, Out),
   amount (DECIMAL 10,2),
   balance_after (snapshot — compute on write),
   reference_id (nullable), reference_type (Invoice/Expense/Manual),
   description, created_at
   Associations: belongsTo WalletAccount

3. Balance computation:
   getAccountBalance(account_id) — SUM all In transactions minus SUM all Out transactions
   Run this on every account fetch

4. routes + controllers:
   GET  /api/v1/wallet/accounts              — list all accounts with computed balance
   POST /api/v1/wallet/accounts              — create account
   PUT  /api/v1/wallet/accounts/:id          — edit name/description
   
   GET  /api/v1/wallet/transactions          — list all transactions, filter: account_id,
                                               type, date_from, date_to, pagination
   POST /api/v1/wallet/transfer              — manual transfer between accounts
     Validates: from_account_id ≠ to_account_id, amount > 0,
     from account has sufficient balance
     Creates 2 transactions: Out on from_account, In on to_account
   
   GET  /api/v1/wallet/summary               — total cash, total bank, grand total

FRONTEND:
1. pages/wallet/index.vue:

   TOP SECTION — Account Balance Cards:
   - One v-card per account (Cash, Bank, etc.)
   - Large balance display (AED format)
   - Color coded: green if positive, red if negative
   - Total balance card at end

   TRANSFER SECTION — v-card:
   - From account selector, To account selector
   - Amount field with balance validation ("Available: AED X")
   - Description/notes field
   - Transfer button → confirm dialog → execute
   - Show error if insufficient balance

   TRANSACTION HISTORY — v-data-table:
   - Columns: Date, Account, Type, Description, Amount (colored: +green/-red), Reference
   - Filter by account and date range
   - Reference links: if Invoice, link to /invoices/[id]

2. components/wallet/TransferDialog.vue:
   - Both account dropdowns populate from GET /wallet/accounts
   - Real-time balance check
   - Disable submit if from_account balance < amount

VALIDATION:
- From and To accounts cannot be the same
- Transfer amount: required, > 0, ≤ from_account balance
- Amount: show inline "Maximum transferable: AED X"
- Description: optional, max 200 chars
- Prevent creating accounts with duplicate names
```

---

## ═══ PROMPT 8: DASHBOARD MODULE ═══

```
Continuing DocClear (Nuxt 3 + Express + MySQL + Vuetify 3).

BUILD: Dashboard — reads across ALL modules

CROSS-MODULE IMPACTS (reads only, no writes):
- Total Customers: COUNT customers WHERE is_active=true
- Active Documents: COUNT documents (all)
- Expiring Soon: COUNT documents WHERE expiry_date BETWEEN NOW() AND NOW()+30 days
- Net Profit: SUM(invoices.total WHERE status=Paid) - SUM(expenses.amount WHERE status=Paid)
  for current calendar month
- Recent Invoices: last 5 invoices ordered by created_at DESC
- Expiring Documents: next 5 documents ordered by expiry_date ASC

BACKEND:
1. routes/dashboard.routes.js + controllers/dashboard.controller.js

   GET /api/v1/dashboard/stats:
   Returns single object:
   {
     total_customers,
     active_documents,
     expiring_soon,        // ≤30 days
     critical_count,       // ≤7 days  
     monthly_revenue,      // current month paid invoices total
     monthly_cost,         // current month paid expenses total
     monthly_profit,       // revenue - cost
     active_service_orders // Pending + InProgress count
   }
   Run as parallel Promise.all() queries for performance.

   GET /api/v1/dashboard/recent-activity:
   Returns:
   {
     recent_invoices: [last 5, with customer name + status + amount],
     expiring_documents: [next 5 by expiry, with customer name + phone_whatsapp + days_remaining]
   }

FRONTEND:
1. pages/index.vue (Dashboard):

   ROW 1 — Stat Cards (v-row with 4 v-col):
   - Total Customers (icon: people, color: blue)
   - Active Documents (icon: description, color: teal)
   - Expiring Soon (icon: warning, color: orange — click navigates to /documents)
   - Net Profit this month (icon: trending_up, color: green)
   Each card: large number, label, subtitle (e.g. "3 critical" / "This month")
   Show v-skeleton-loader while fetching.

   ROW 2 — Two columns:
   LEFT: Recent Invoices v-list
   - Each item: Invoice#, Customer, Amount chip, Status chip
   - "View All" link → /invoices

   RIGHT: Expiring Documents v-list
   - Each item: Document type, Customer name, Days remaining chip (colored by urgency)
   - WhatsApp icon button on each → buildWhatsAppLink(phone, reminder message)
   - "View All" link → /documents

2. Auto-refresh: dashboard stats refresh every 5 minutes (setInterval in onMounted)
3. Show last updated timestamp: "Updated at HH:MM"

VALIDATION: N/A (read-only page)
```

---

## ═══ PROMPT 9: REPORTS MODULE ═══

```
Continuing DocClear (Nuxt 3 + Express + MySQL + Vuetify 3).

BUILD: Reports & Analytics Module

CROSS-MODULE IMPACTS (reads only):
- Revenue data: from invoices WHERE status=Paid
- Cost data: from expenses WHERE status=Paid
- Service revenue breakdown: JOIN invoices → invoice_items → service descriptions
- Monthly trends: GROUP BY YEAR(created_at), MONTH(created_at)

BACKEND:
1. routes/reports.routes.js + controllers/reports.controller.js

   GET /api/v1/reports/financial-summary?from=&to=:
   { total_revenue, total_cost, net_profit, profit_margin_pct,
     invoice_count, paid_invoice_count, unpaid_invoice_count }

   GET /api/v1/reports/monthly-trends?months=6:
   Array of: { month (MMM YYYY), revenue, cost, profit }
   Last N months, oldest first.

   GET /api/v1/reports/revenue-by-service?from=&to=:
   Array of: { service_name, total_revenue, percentage }
   JOIN invoices → service_orders → service_types

   GET /api/v1/reports/expense-by-category?from=&to=:
   Array of: { category, total_amount, percentage }

   GET /api/v1/reports/customer-summary?from=&to=:
   Top 10 customers by revenue: { customer_name, total_invoiced, invoice_count }

FRONTEND:
1. pages/reports/index.vue:

   DATE RANGE FILTER ROW:
   - From date + To date pickers (default: first of current month → today)
   - "Apply" button — triggers all chart refreshes

   ROW 1 — Financial Summary Cards:
   Total Revenue | Total Cost | Net Profit | Profit Margin %
   (reuse StatCard component pattern)

   ROW 2 — Charts (use vue-chartjs or apexcharts-vue3):
   LEFT (2/3 width): Grouped Bar Chart — Monthly Revenue vs Cost vs Profit
   RIGHT (1/3 width): Donut Chart — Revenue by Service Type

   ROW 3 — Two tables:
   LEFT: Expense by Category (v-simple-table)
   RIGHT: Top Customers by Revenue (v-simple-table)

2. Install: npm install vue-chartjs chart.js
   OR: npm install apexvue3 (preferred — better Vuetify integration)
   
3. All charts responsive (use v-responsive wrapper)
4. Show empty state illustration if no data in date range
5. Export button: "Export CSV" → generate CSV client-side from chart data using
   Papa.parse or manual CSV string + Blob download

VALIDATION:
- Date range: from must be before to
- Max date range: 1 year (show warning if exceeded)
- Show "No data" empty state for empty results
```

---

## ═══ PROMPT 10: PRODUCTION HARDENING ═══

```
Continuing DocClear (Nuxt 3 + Express + MySQL + Vuetify 3).

BUILD: Production Readiness — apply across ALL modules

SECURITY:
1. Backend — apply to all routes:
   - helmet() already applied — verify CSP headers
   - express-rate-limit: 100 req/min per IP globally, 10/min on auth routes
   - All user inputs sanitized with express-validator .trim().escape() before DB write
   - SQL injection: Sequelize parameterized queries already prevent this — verify no raw()
   - JWT expiry: 24h access token. Add refresh token (7d) stored httpOnly cookie.
   - Add /api/v1/auth/refresh route
   - CORS: restrict to FRONTEND_URL env var only

2. Frontend:
   - Never store JWT in localStorage in production — move to httpOnly cookie via refresh flow
   - Add route meta: requiresAuth: true on all protected pages
   - Add role-based UI guards: Admin-only sections (user management, delete operations)

ERROR HANDLING:
3. Backend global error handler (already in app.js skeleton) — enhance:
   - Sequelize ValidationError → 400 with field-level errors
   - Sequelize UniqueConstraintError → 409 with "already exists" message  
   - JWT errors → 401
   - Not found → 404
   - All others → 500 (log full error, return generic message in production)

4. Frontend global:
   - Axios response interceptor: on 401 → clear auth → redirect /login
   - On 422/400 → extract errors array → pass to form component
   - On 500 → show generic "Something went wrong" snackbar
   - Add composable: useApiError(error) → returns human-readable message

PERFORMANCE:
5. Backend:
   - Add database indexes: customers(email), documents(expiry_date, customer_id),
     invoices(customer_id, status, created_at), wallet_transactions(account_id, created_at)
   - Add response compression: npm install compression, app.use(compression())
   - Pagination: enforce max limit=100 on all list endpoints

6. Frontend:
   - Lazy load pages: Nuxt does this automatically with file-based routing ✓
   - Debounce all search inputs (400ms) — add useDebounce composable
   - v-data-table: always use server-side pagination (never load all records)

UX POLISH:
7. Global components to create/verify:
   - components/common/ConfirmDialog.vue — reusable confirm modal (used by all deletes)
   - components/common/StatusBadge.vue — colored chip for document/invoice/order status
   - components/common/EmptyState.vue — illustration + message for empty tables
   - components/common/PageHeader.vue — title + breadcrumbs + action slot
   - composables/useNotify.js — wrapper for Vuetify snackbar (success/error/info)

8. Form UX rules (apply to all forms):
   - Validate on blur (not on every keystroke)
   - Show field errors below field in red using Vuetify :error-messages
   - Disable submit button while API call in progress (show v-progress-circular)
   - After successful save: close dialog + show success snackbar + refresh table
   - After failed save: keep dialog open + show field errors OR error snackbar

9. Mobile responsiveness:
   - Sidebar collapses to hamburger on mobile (v-navigation-drawer :temporary on xs)
   - All v-data-tables: on mobile show simplified columns (hide less important cols)
   - All dialogs: full-screen on mobile (v-dialog :fullscreen="$vuetify.display.smAndDown")

MIGRATIONS & SEED:
10. Create Sequelize migrations for all tables (run in order):
    001_create_users, 002_create_customers, 003_create_documents,
    004_create_service_types, 005_create_service_orders,
    006_create_invoices, 007_create_invoice_items,
    008_create_expenses, 009_create_wallet_accounts, 010_create_wallet_transactions
    Add indexes in migrations.

11. Seeder: seeders/demo.js
    - 1 admin user (admin@docclear.ae / Admin@1234)
    - 2 wallet accounts (Cash, Bank)
    - 5 service types
    - 3 sample customers with documents and invoices

DEPLOYMENT:
12. Add to backend package.json scripts:
    "migrate": "sequelize-cli db:migrate"
    "seed": "sequelize-cli db:seed:all"
    "start": "node app.js"
    "dev": "nodemon app.js"

13. Add Dockerfile for backend, Dockerfile for frontend, update docker-compose.yml
    with all three services (mysql, backend, frontend) + nginx reverse proxy config.

14. Add .env.production.example with all required variables documented.
```

---

## IMPLEMENTATION ORDER

Build in this sequence to avoid cross-module dependency issues:

```
1. PROMPT 0  — Bootstrap (no deps)
2. PROMPT 1  — Auth (required by all)
3. PROMPT 7  — Wallet Accounts setup (needed by Invoice + Expense paid flows)
4. PROMPT 2  — Customers (needed by Documents, Services, Invoices)
5. PROMPT 3  — Documents (depends on Customers)
6. PROMPT 4  — Services (depends on Customers + triggers Invoice creation)
7. PROMPT 5  — Invoices (depends on Services + Customers + Wallet)
8. PROMPT 6  — Expenses (depends on Wallet)
9. PROMPT 8  — Dashboard (reads all modules)
10. PROMPT 9  — Reports (reads all modules)
11. PROMPT 10 — Production hardening (applies across all)
```

---

## WHATSAPP LINK REFERENCE

All WhatsApp interactions use this single composable. No API required.

```javascript
// composables/useWhatsApp.js
export const useWhatsApp = () => {
  const buildLink = (phone, message = '') => {
    // Clean phone: remove spaces, dashes, parentheses
    let cleaned = phone.replace(/[\s\-\(\)]/g, '')
    // Remove leading 0 (local format)
    if (cleaned.startsWith('0')) cleaned = cleaned.slice(1)
    // Remove leading + for wa.me format
    cleaned = cleaned.replace(/^\+/, '')
    const encoded = message ? `?text=${encodeURIComponent(message)}` : ''
    return `https://wa.me/${cleaned}${encoded}`
  }

  const openWhatsApp = (phone, message = '') => {
    window.open(buildLink(phone, message), '_blank')
  }

  const MESSAGES = {
    docReminder: (name, docType, docNo, expiry) =>
      `Dear ${name}, your ${docType} (No: ${docNo}) expires on ${expiry}. Please contact us to initiate renewal.`,
    invoiceReady: (name, invNo, amount) =>
      `Dear ${name}, your invoice ${invNo} for AED ${amount} is ready. Please arrange payment at your earliest convenience.`,
    general: (name) =>
      `Dear ${name}, greetings from DocClear Management.`,
  }

  return { buildLink, openWhatsApp, MESSAGES }
}
```

---

## VALIDATION QUICK-REFERENCE (apply everywhere)

| Field Type | Rule |
|---|---|
| Phone/WhatsApp | Required, international format, 8-15 digits, /^\+?[1-9]\d{7,14}$/ |
| Email | Optional on customer, valid format if provided, max 100 |
| Names | Required, 2-150 chars, no special chars except space/hyphen |
| Prices | Required, > 0, max 2 decimal places, numeric |
| Dates | Valid date, expiry > issue if both present |
| Text areas | Optional unless noted, max 500 |
| Amounts | > 0, numeric, DECIMAL(10,2) in DB |
| Status fields | Always from defined ENUM — validate on both FE and BE |

All validation: **dual-layer** — Vuelidate (FE) + express-validator (BE).
Never trust client-only validation.
```
