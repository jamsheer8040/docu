const { sequelize } = require("./models"); sequelize.query("SELECT * FROM tenant_invoices WHERE status = '' OR status IS NULL").then(([res]) => { console.log(res); process.exit(0); });
