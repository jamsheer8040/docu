const { Document, Customer, DocumentType } = require('../models');

async function main() {
  try {
    const res = await Document.findAndCountAll({
      where: {},
      include: [
        {
          model: Customer,
          attributes: ['name', 'phone_whatsapp']
        },
        {
          model: DocumentType,
          attributes: ['name', 'category']
        }
      ],
      limit: 10,
      offset: 0,
      subQuery: false
    });
    console.log('Query succeeded!', res.count);
  } catch (err) {
    console.error('QUERY FAILED:', err);
  }
  process.exit();
}

main();
