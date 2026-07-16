const fs = require('fs');
const path = require('path');

const code = `
/**
 * Profit Details
 */
exports.getProfitReportDetails = async (req, res) => {
    try {
        const dateWhere = getDateRangeWhere(req.query);
        let { page = 1, limit = 50 } = req.query;
        limit = parseInt(limit);
        const offset = (page - 1) * limit;

        const { count, rows } = await Invoice.findAndCountAll({
            where: { [Op.or]: [{ status: 'Paid' }, { status: 'Partially Paid' }, { status: 'Sent' }, { status: 'Issued' }], ...dateWhere },
            attributes: [
                'id', 'invoice_number', 'status', 'created_at',
                'subtotal', 'cost_total', 'total', 'paid_amount',
                [literal('subtotal - cost_total'), 'gross_profit'],
            ],
            include: [{ model: Customer, attributes: ['name'] }],
            order: [['created_at', 'DESC']],
            limit,
            offset
        });

        const overheadCosts = await Expense.sum('paid_amount', {
            where: { [Op.or]: [{ status: 'Paid' }, { status: 'Partially Paid' }], ...dateWhere }
        });

        res.json({
            success: true,
            data: {
                invoices: rows,
                total_invoices: count,
                total_pages: Math.ceil(count / limit),
                current_page: parseInt(page),
                overhead_costs: overheadCosts || 0
            }
        });
    } catch (err) {
        console.error('getProfitReportDetails Error:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch profit details' });
    }
};

/**
 * Service Wise Details
 */
exports.getServiceWiseReport = async (req, res) => {
    try {
        const dateWhere = getDateRangeWhere(req.query);
        const results = await InvoiceItem.findAll({
            attributes: [
                'description',
                [fn('SUM', col('quantity')), 'total_quantity'],
                [fn('SUM', literal('selling_price * quantity')), 'total_revenue'],
                [fn('SUM', literal('cost_price * quantity')), 'total_cost'],
                [fn('SUM', literal('(selling_price - cost_price) * quantity')), 'gross_profit']
            ],
            include: [{
                model: Invoice,
                where: { [Op.or]: [{ status: 'Paid' }, { status: 'Partially Paid' }, { status: 'Issued' }, { status: 'Sent' }], ...dateWhere },
                attributes: []
            }],
            group: ['description'],
            order: [[literal('total_revenue'), 'DESC']]
        });

        res.json({ success: true, data: results });
    } catch (err) {
        console.error('getServiceWiseReport Error:', err);
        res.status(500).json({ success: false, message: 'Failed service breakdown' });
    }
};
`;

const filePath = path.join(__dirname, '../controllers/reports.controller.js');
fs.appendFileSync(filePath, code);
console.log('Appended successfully');
