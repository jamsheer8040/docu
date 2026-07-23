const { User, Role, Customer } = require('./models');
const customerController = require('./controllers/customer.controller');
const tenantContext = require('./utils/tenantContext');

async function run() {
  try {
    const user = await User.findOne({
      where: { email: 'ashraf5@gmail.com' },
      include: [
        { model: Role, attributes: ['name', 'permissions', 'type'] },
        { model: Customer, as: 'LinkedCustomers', attributes: ['id', 'name'] }
      ]
    });
    
    if (!user) return console.log('User not found');

    const req = {
      user: user,
      query: { limit: 10, page: 1, is_active: 'true' }
    };
    
    const res = {
      json: (data) => console.log('Response JSON:', JSON.stringify(data, null, 2)),
      status: (code) => {
        console.log('Response Status:', code);
        return res;
      }
    };

    await tenantContext.run(user.tenant_id, async () => {
      await customerController.getCustomers(req, res);
    });

  } catch (err) {
    console.error(err);
  }
}

run();
