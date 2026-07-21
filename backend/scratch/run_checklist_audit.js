const fs = require('fs');
const path = require('path');
const db = require('../models');

async function auditModels() {
  console.log('\n--- 1. AUDITING MODELS FOR MULTI-TENANT ISOLATION ---');
  const models = Object.keys(db.sequelize.models);
  let issuesFound = 0;

  for (const modelName of models) {
    const model = db.sequelize.models[modelName];
    const attributes = model.rawAttributes;
    
    // Check if model has tenant_id
    const hasTenantId = !!attributes.tenant_id;
    
    if (hasTenantId) {
      // Check for global uniques defined at field level
      for (const attrName of Object.keys(attributes)) {
        if (attrName === 'tenant_id') continue;
        const attr = attributes[attrName];
        
        if (attr.unique === true) {
          // Exception: User email or slug are okay if they are global systems
          if (modelName === 'User' && attrName === 'email') continue;
          
          console.warn(`[WARNING] Model '${modelName}' has global unique constraint on attribute '${attrName}'! This will block other tenants from using duplicate values.`);
          issuesFound++;
        }
      }
    }
  }
  
  if (issuesFound === 0) {
    console.log('[SUCCESS] All scoped models verified. No global unique field constraints found.');
  } else {
    console.log(`[ACTION REQUIRED] Found ${issuesFound} global unique constraint warnings.`);
  }
}

function auditControllersForWalletTransactions() {
  console.log('\n--- 2. AUDITING WALLET TRANSACTION LEDGER CONSTRAINTS ---');
  const controllerDir = path.join(__dirname, '../controllers');
  const files = fs.readdirSync(controllerDir).filter(f => f.endsWith('.js'));
  let issuesFound = 0;

  for (const file of files) {
    const filePath = path.join(controllerDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Find WalletTransaction.create invocations
    const regex = /WalletTransaction\.create\(\s*\{([\s\S]*?)\}/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const block = match[1];
      const hasDirection = block.includes('direction:');
      const hasType = block.includes('type:');
      const hasBalanceAfter = block.includes('balance_after:');
      
      if (!hasDirection || !hasType) {
        console.warn(`[WARNING] In '${file}': WalletTransaction.create appears to be missing 'direction' or 'type'!`);
        console.warn(`Captured block:\n${block.trim()}\n`);
        issuesFound++;
      }
      if (!hasBalanceAfter) {
        console.log(`[INFO] In '${file}': WalletTransaction.create doesn't calculate 'balance_after' explicitly (which is nullable, but good to have).`);
      }
    }
  }

  if (issuesFound === 0) {
    console.log('[SUCCESS] All WalletTransaction insertions verified for type/direction constraints.');
  } else {
    console.log(`[ACTION REQUIRED] Found ${issuesFound} issues in WalletTransaction ledger writes.`);
  }
}

async function checkRBACGuardIntegrations() {
  console.log('\n--- 3. AUDITING ROUTE RBAC INTEGRATION ---');
  const routesDir = path.join(__dirname, '../routes');
  const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
  let routesAudited = 0;
  let unguardedCount = 0;

  for (const file of files) {
    const filePath = path.join(routesDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check if requirePermission or checkManagement is used in route definitions
    const hasRequirePermission = content.includes('requirePermission') || content.includes('checkManagement');
    const isPublic = ['auth.routes.js', 'saas.routes.js'].includes(file);
    
    if (!hasRequirePermission && !isPublic) {
      console.warn(`[WARNING] Route file '${file}' does not seem to enforce 'requirePermission' guards on its endpoints.`);
      unguardedCount++;
    }
    routesAudited++;
  }

  console.log(`[INFO] Audited ${routesAudited} route files. Found ${unguardedCount} unguarded files (verify if they represent public APIs).`);
}

async function run() {
  try {
    await auditModels();
    auditControllersForWalletTransactions();
    await checkRBACGuardIntegrations();
  } catch (err) {
    console.error(err);
  }
  process.exit();
}

run();
