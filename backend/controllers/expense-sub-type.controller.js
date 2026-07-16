const ExpenseSubType = require('../models/ExpenseSubType');
const ExpenseType = require('../models/ExpenseType');
const Expense = require('../models/Expense');

exports.listSubTypes = async (req, res) => {
    try {
        const subTypes = await ExpenseSubType.findAll({
            include: [
                {
                    model: ExpenseType,
                    as: 'ParentType',
                    attributes: ['id', 'type_name']
                }
            ],
            order: [['sub_type_name', 'ASC']]
        });
        res.json({ success: true, data: subTypes });
    } catch (err) {
        console.error('List Sub Types Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch expense sub types' });
    }
};

exports.createSubType = async (req, res) => {
    try {
        const { sub_type_name, expense_type_id, description, status } = req.body;
        
        if (!sub_type_name || !expense_type_id) {
            return res.status(400).json({ success: false, message: 'Sub Type Name and Parent Type are required' });
        }

        const existing = await ExpenseSubType.findOne({ where: { sub_type_name, expense_type_id } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Sub Type already exists under this Parent' });
        }

        const subType = await ExpenseSubType.create({
            sub_type_name,
            expense_type_id,
            description,
            status: status || 'Active',
            tenant_id: req.user.tenant_id || 1
        });

        res.status(201).json({ success: true, data: subType });
    } catch (err) {
        console.error('Create Sub Type Error:', err);
        res.status(500).json({ success: false, message: 'Failed to create expense sub type' });
    }
};

exports.updateSubType = async (req, res) => {
    try {
        const subType = await ExpenseSubType.findByPk(req.params.id);
        if (!subType) return res.status(404).json({ success: false, message: 'Sub Type not found' });

        const { sub_type_name, expense_type_id, description, status } = req.body;
        
        if (sub_type_name && sub_type_name !== subType.sub_type_name) {
            const existing = await ExpenseSubType.findOne({ 
                where: { 
                    sub_type_name, 
                    expense_type_id: expense_type_id || subType.expense_type_id 
                } 
            });
            if (existing) {
                return res.status(400).json({ success: false, message: 'Sub Type Name already exists under this Parent' });
            }
        }

        await subType.update({
            sub_type_name,
            expense_type_id,
            description,
            status
        });

        res.json({ success: true, data: subType });
    } catch (err) {
        console.error('Update Sub Type Error:', err);
        res.status(500).json({ success: false, message: 'Failed to update expense sub type' });
    }
};

exports.deleteSubType = async (req, res) => {
    try {
        const subType = await ExpenseSubType.findByPk(req.params.id);
        if (!subType) return res.status(404).json({ success: false, message: 'Sub Type not found' });

        const expensesCount = await Expense.count({ where: { expense_sub_type_id: subType.id } });
        if (expensesCount > 0) {
            return res.status(400).json({ success: false, message: 'Cannot delete a sub type that has associated expenses' });
        }

        await subType.destroy();
        res.json({ success: true, message: 'Sub Type deleted successfully' });
    } catch (err) {
        console.error('Delete Sub Type Error:', err);
        res.status(500).json({ success: false, message: 'Failed to delete expense sub type' });
    }
};
