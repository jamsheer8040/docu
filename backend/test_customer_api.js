const { Customer, Document, DocumentType, sequelize } = require('./models');
const tenantContext = require('./utils/tenantContext');

async function run() {
  try {
    await tenantContext.run(10, async () => {
      const { count, rows } = await Customer.findAndCountAll({
        where: { is_active: true },
        limit: 10,
        offset: 0,
        order: [['name', 'ASC']],
        include: [
          { 
            model: Document, 
            limit: 3, 
            include: [{ model: DocumentType, attributes: ['name'] }],
            order: [['expiry_date', 'ASC']] 
          }
        ]
      });

      console.log('Count:', count);
      console.log('Rows:', JSON.stringify(rows, null, 2));
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
