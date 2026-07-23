const { sequelize } = require("./models"); sequelize.query("UPDATE tenant_invoices SET status='void' WHERE status = '' OR status IS NULL").then(() => { console.log("Fixed"); process.exit(0); });
