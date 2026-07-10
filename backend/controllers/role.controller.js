const { Role, User } = require('../models');

exports.getRoles = async (req, res) => {
  try {
    const where = {};
    if (req.user?.Role?.name !== 'Developer') {
      where.name = { [require('sequelize').Op.ne]: 'Developer' };
    }

    // 1. Fetch all roles
    const roles = await Role.findAll({
      where,
      order: [['name', 'ASC']]
    });

    // 2. Fetch User counts per role
    const userCounts = await User.findAll({
        attributes: [
            'role_id',
            [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']
        ],
        group: ['role_id'],
        raw: true
    });

    // 3. Map counts back to role objects
    const data = roles.map(role => {
        const roleJson = role.toJSON();
        const countData = userCounts.find(uc => uc.role_id === role.id);
        roleJson.UserCount = countData ? parseInt(countData.count) : 0;
        
        // ULTIMATE GUARD: Force Admin to Full Access at the SDK level
        if (roleJson.name === 'Admin') {
            roleJson.permissions = {
                dashboard: { read: true, write: true, delete: true },
                customers: { read: true, write: true, delete: true },
                documents: { read: true, write: true, delete: true },
                services: { read: true, write: true, delete: true },
                invoices: { read: true, write: true, delete: true },
                expenses: { read: true, write: true, delete: true },
                wallet: { read: true, write: true, delete: true },
                reports: { read: true, write: true, delete: true },
                settings: { read: true, write: true, delete: true },
                financials: { read: true, write: true, delete: true }
            };
        } else if (roleJson.type === 'CustomerPortal') {
            // Customer Portal roles can only have documents permissions
            const docsPerms = roleJson.permissions?.documents || { read: false, write: false, delete: false };
            roleJson.permissions = {
                dashboard: { read: false, write: false, delete: false },
                customers: { read: false, write: false, delete: false },
                documents: {
                    read: docsPerms.read === true,
                    write: docsPerms.write === true,
                    delete: docsPerms.delete === true
                },
                services: { read: false, write: false, delete: false },
                invoices: { read: false, write: false, delete: false },
                expenses: { read: false, write: false, delete: false },
                wallet: { read: false, write: false, delete: false },
                reports: { read: false, write: false, delete: false },
                settings: { read: false, write: false, delete: false },
                financials: { read: false, write: false, delete: false }
            };
        }
        return roleJson;
    });

    res.json({ success: true, data });
  } catch (err) {
    console.error('[Role Controller] Error:', err);
    res.status(500).json({ success: false, message: 'Error fetching roles.' });
  }
};

exports.getRoleById = async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) return res.status(404).json({ success: false, message: 'Role not found.' });
    res.json({ success: true, data: role });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error fetching role.' });
  }
};

exports.createRole = async (req, res) => {
  try {
    const { name, type = 'Internal', permissions } = req.body;
    let finalPerms = permissions || {
      dashboard: { read: type === 'Internal', write: type === 'Internal', delete: type === 'Internal' },
      customers: { read: false, write: false, delete: false },
      documents: { read: false, write: false, delete: false },
      services: { read: false, write: false, delete: false },
      invoices: { read: false, write: false, delete: false },
      expenses: { read: false, write: false, delete: false },
      wallet: { read: false, write: false, delete: false },
      reports: { read: false, write: false, delete: false },
      settings: { read: false, write: false, delete: false },
      financials: { read: false, write: false, delete: false }
    };

    if (type === 'CustomerPortal') {
      const docsPerms = finalPerms.documents || { read: false, write: false, delete: false };
      finalPerms = {
        dashboard: { read: false, write: false, delete: false },
        customers: { read: false, write: false, delete: false },
        documents: {
          read: docsPerms.read === true,
          write: docsPerms.write === true,
          delete: docsPerms.delete === true
        },
        services: { read: false, write: false, delete: false },
        invoices: { read: false, write: false, delete: false },
        expenses: { read: false, write: false, delete: false },
        wallet: { read: false, write: false, delete: false },
        reports: { read: false, write: false, delete: false },
        settings: { read: false, write: false, delete: false },
        financials: { read: false, write: false, delete: false }
      };
    }

    const role = await Role.create({ name, type, permissions: finalPerms });
    res.status(201).json({ success: true, data: role });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error creating role.' });
  }
};

exports.updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log(`[Role Controller] Attempting update for Role ID: ${id}`);
    
    const role = await Role.findByPk(id);
    if (!role) {
      console.warn(`[Role Controller] Role ID: ${id} not found.`);
      return res.status(404).json({ success: false, message: 'Role not found.' });
    }

    // PROTECT SYSTEM ROLES FROM RENAME
    if ((role.name === 'Admin' || role.name === 'Staff') && updateData.name && updateData.name !== role.name) {
        return res.status(400).json({ success: false, message: 'System role names cannot be changed.' });
    }

    // Sanitize permissions for CustomerPortal type roles
    const currentType = updateData.type || role.type;
    if (updateData.permissions && currentType === 'CustomerPortal') {
      const docsPerms = updateData.permissions.documents || { read: false, write: false, delete: false };
      updateData.permissions = {
        dashboard: { read: false, write: false, delete: false },
        customers: { read: false, write: false, delete: false },
        documents: {
          read: docsPerms.read === true,
          write: docsPerms.write === true,
          delete: docsPerms.delete === true
        },
        services: { read: false, write: false, delete: false },
        invoices: { read: false, write: false, delete: false },
        expenses: { read: false, write: false, delete: false },
        wallet: { read: false, write: false, delete: false },
        reports: { read: false, write: false, delete: false },
        settings: { read: false, write: false, delete: false },
        financials: { read: false, write: false, delete: false }
      };
    }

    // Force permissions update if present
    if (updateData.permissions) {
      console.log(`[Role Controller] Updating permissions for ${role.name}:`, JSON.stringify(updateData.permissions).substring(0, 50) + '...');
      role.permissions = updateData.permissions;
      role.changed('permissions', true);
    }

    await role.update(updateData);
    console.log(`[Role Controller] Role ${role.name} updated successfully.`);
    res.json({ success: true, data: role });
  } catch (err) {
    console.error('[Role Controller] Update failed:', err);
    res.status(500).json({ success: false, message: 'Error updating role.' });
  }
};

exports.deleteRole = async (req, res) => {
  try {
    const role = await Role.findByPk(req.params.id);
    if (!role) {
      return res.status(404).json({ success: false, message: 'Role not found.' });
    }

    // Prevent deletion of protected roles
    if (role.name === 'Admin' || role.name === 'Staff') {
        return res.status(400).json({ success: false, message: 'System roles cannot be deleted.' });
    }

    // CHECK FOR ASSIGNED USERS
    const userCount = await User.count({ where: { role_id: role.id } });
    if (userCount > 0) {
        return res.status(400).json({ success: false, message: `Cannot delete role "${role.name}" because it has ${userCount} users assigned.` });
    }

    await role.destroy();
    res.json({ success: true, message: 'Role deleted successfully.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error deleting role.' });
  }
};
