const ExpenseType = require('../models/ExpenseType');
const ExpenseSubType = require('../models/ExpenseSubType');

exports.listTypes = async (req, res) => {
    try {
        const types = await ExpenseType.findAll({
            include: [
                {
                    model: ExpenseSubType,
                    as: 'SubTypes',
                    attributes: ['id'] // For count calculation
                }
            ],
            order: [['type_name', 'ASC']]
        });
        
        const data = types.map(t => {
            const raw = t.get({ plain: true });
            raw.sub_type_count = raw.SubTypes ? raw.SubTypes.length : 0;
            delete raw.SubTypes; // Return count instead of full array
            return raw;
        });

        res.json({ success: true, data });
    } catch (err) {
        console.error('List Types Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch expense types' });
    }
};

exports.createType = async (req, res) => {
    try {
        const { type_name, description, status } = req.body;
        if (!type_name) return res.status(400).json({ success: false, message: 'Type Name is required' });

        const existing = await ExpenseType.findOne({ where: { type_name } });
        if (existing) return res.status(400).json({ success: false, message: 'Type Name already exists' });

        const type = await ExpenseType.create({ 
            type_name, 
            description, 
            status: status || 'Active',
            tenant_id: req.user.tenant_id || 1
        });
        res.status(201).json({ success: true, data: type });
    } catch (err) {
        console.error('Create Type Error:', err);
        res.status(500).json({ success: false, message: 'Failed to create expense type' });
    }
};

exports.updateType = async (req, res) => {
    try {
        const type = await ExpenseType.findByPk(req.params.id);
        if (!type) return res.status(404).json({ success: false, message: 'Type not found' });

        const { type_name, description, status } = req.body;
        
        if (type_name && type_name !== type.type_name) {
            const existing = await ExpenseType.findOne({ where: { type_name } });
            if (existing) return res.status(400).json({ success: false, message: 'Type Name already exists' });
        }

        await type.update({ type_name, description, status });
        res.json({ success: true, data: type });
    } catch (err) {
        console.error('Update Type Error:', err);
        res.status(500).json({ success: false, message: 'Failed to update expense type' });
    }
};

exports.deleteType = async (req, res) => {
    try {
        const type = await ExpenseType.findByPk(req.params.id);
        if (!type) return res.status(404).json({ success: false, message: 'Type not found' });

        const subTypeCount = await ExpenseSubType.count({ where: { expense_type_id: type.id } });
        if (subTypeCount > 0) {
            return res.status(400).json({ success: false, message: 'Cannot delete a type that has associated sub-types' });
        }

        await type.destroy();
        res.json({ success: true, message: 'Type deleted successfully' });
    } catch (err) {
        console.error('Delete Type Error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete expense type' });
    }
};
