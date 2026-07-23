const fs = require('fs');
const path = require('path');

const files = [
  'pages/wallet/index.vue',
  'pages/sales-orders/index.vue',
  'pages/invoices/index.vue',
  'pages/expenses/index.vue',
  'components/wallet/TransferDialog.vue',
  'components/reports/ProfitReport.vue',
  'components/reports/ServiceReport.vue',
  'components/reports/InvoiceReport.vue',
  'components/invoices/InvoiceDialog.vue',
  'components/expenses/ExpenseDialog.vue',
  'components/reports/ExpenseReport.vue',
  'components/expenses/ExpenseSettingsDialog.vue',
  'components/invoices/InvoiceDetailView.vue'
];

for (const relPath of files) {
  const fullPath = path.join(__dirname, relPath);
  if (!fs.existsSync(fullPath)) continue;

  let content = fs.readFileSync(fullPath, 'utf8');

  // Skip if no alert
  if (!content.includes('alert(')) continue;

  // Add import and uiStore initialization if needed
  if (!content.includes('useUIStore')) {
    content = content.replace(
      /<script setup>/,
      `<script setup>\nimport { useUIStore } from '~/stores/ui'\n\nconst uiStore = useUIStore()`
    );
  }

  // Replace alert(...) with uiStore.showError(...)
  content = content.replace(/\balert\(/g, 'uiStore.showError(');

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log('Processed', relPath);
}
console.log('Done');
