# Task: Final Workflow & CRUD Testing

## 1. Environment & Database Synchronization
- [x] Reset MySQL database via Sequelize migrations
- [x] Seed database with RBAC and demo data (`seed_rbac.js` and `demo-data.js`)
- [x] Verify backend server status (`npm run dev`)
- [x] Verify frontend server status (`npm run dev`)

## 2. Module CRUD Verification
- [ ] **Customers**: Create a new customer, Edit, View Profile, Soft Delete
- [ ] **Documents**: Add a document, verify Kanban/Calendar views, WhatsApp action
- [ ] **Services**: Define Service Types, Create Service Order
- [ ] **Invoices**: Manual create, PDF generation, WhatsApp sharing
- [ ] **Expenses**: Log an expense, Category management
- [ ] **Wallet**: Account creation, Manual Transaction

## 3. Integrated Business Workflow (E2E Journey)
- [ ] **Step 1**: Create a new Customer with full details
- [ ] **Step 2**: Add a "Trade License" document with expiry date
- [ ] **Step 3**: Create a Service Order -> Advance to "In Progress"
- [ ] **Step 4**: Advance Service Order to "Completed"
- [ ] **Step 5**: Verify Draft Invoice is auto-generated
- [ ] **Step 6**: Mark Invoice as "Paid" using "Bank" wallet account
- [ ] **Step 7**: Verify Wallet balance increased
- [ ] **Step 8**: Log a "Typing Fee" Expense -> Mark as "Paid" from "Bank"
- [ ] **Step 9**: Verify Wallet balance decreased

## 4. Security & RBAC
- [ ] Verify Admin login and permissions
- [ ] Verify role-based UI guards

## 5. Final Insights Verification
- [ ] **Dashboard**: Verify counters match the test data
- [ ] **Reports**: Verify revenue/cost charts match the ledger
