const { Customer, Document, DocumentType } = require('../models');

async function main() {
  try {
    const res = await Customer.findAndCountAll({
      limit: 10,
      offset: 0,
      include: [
        { 
          model: Document, 
          limit: 3, 
          include: [{ model: DocumentType, attributes: ['name'] }],
          order: [['expiry_date', 'ASC']] 
        }
      ]
    });
    console.log('Query succeeded!', res.count);
  } catch (err) {
    console.error('QUERY FAILED:', err);
  }
  process.exit();
}

main();
