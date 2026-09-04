const billingService = require('../services/billingService');

// @desc    Get aggregated platform billing metrics and transactions
// @route   GET /api/superadmin/billing/summary
// @access  Private (Super Admin)
const getBillingSummary = async (req, res, next) => {
  try {
    const summary = await billingService.getSuperAdminBillingMetrics();
    return res.json({
      success: true,
      ...summary,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getBillingSummary,
};
