const { DocumentType } = require('../models');

async function main() {
  try {
    const list = await DocumentType.findAll();
    console.log('List of document types:', list.map(t => t.toJSON()));
    
    // Test creation
    const name = `TestDoc-${Date.now()}`;
    const newType = await DocumentType.create({ name, category: 'Company Document', tenant_id: 1 });
    console.log('Created document type:', newType.toJSON());
  } catch (err) {
    console.error('QUERY FAILED:', err);
  }
  process.exit();
}

main();
